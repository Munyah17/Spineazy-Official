-- Spineazy: admin, super-admin and affiliate dashboard backend.
--
-- Adds an affiliate_commissions ledger (referral_code / referred_by already
-- existed on profiles -- this just tracks what each referral earns) plus a
-- set of SECURITY DEFINER RPCs so the dashboard pages never read admin-only
-- aggregates through client-side RLS. Every stats function re-checks
-- is_admin()/is_super_admin() itself, so it's safe even if it's ever called
-- with an anon/user session.
--
-- NOTE: the 10% commission rate below is a placeholder -- swap it for your
-- real affiliate terms. platform_profit is an approximation (bet stakes
-- minus payouts and bonus credits), not audited revenue.

-- Public lookup so the sign-up form can resolve a ?ref=CODE link to the
-- referring user's id without needing profiles to be publicly readable.
create or replace function public.fn_resolve_referral_code(p_code text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.profiles where referral_code = p_code limit 1;
$$;

grant execute on function public.fn_resolve_referral_code(text) to anon, authenticated;

create table public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  deposit_id uuid references public.deposits(id) on delete set null,
  amount numeric(14,2) not null check (amount >= 0),
  rate numeric(5,2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'void')),
  created_at timestamptz not null default now()
);

create index affiliate_commissions_affiliate_idx on public.affiliate_commissions (affiliate_id);
create index affiliate_commissions_referred_user_idx on public.affiliate_commissions (referred_user_id);
create unique index affiliate_commissions_deposit_idx on public.affiliate_commissions (deposit_id) where deposit_id is not null;

alter table public.affiliate_commissions enable row level security;

create policy "affiliate_commissions_select_own_or_admin" on public.affiliate_commissions
  for select using (affiliate_id = auth.uid() or public.is_admin());

grant select on public.affiliate_commissions to authenticated;

-- Called from the deposit webhook routes (service role) right after
-- fn_complete_deposit. No-op if the depositing user has no referrer, or if
-- a commission for this deposit was already recorded.
create or replace function public.fn_record_referral_commission(
  p_referred_user_id uuid,
  p_deposit_id uuid,
  p_amount numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affiliate_id uuid;
  v_rate numeric := 10.00;
begin
  select referred_by into v_affiliate_id from public.profiles where id = p_referred_user_id;
  if v_affiliate_id is null then
    return;
  end if;

  insert into public.affiliate_commissions (affiliate_id, referred_user_id, deposit_id, amount, rate)
  values (v_affiliate_id, p_referred_user_id, p_deposit_id, round(p_amount * v_rate / 100, 2), v_rate)
  on conflict (deposit_id) where deposit_id is not null do nothing;
end;
$$;

grant execute on function public.fn_record_referral_commission(uuid, uuid, numeric) to service_role;

create or replace function public.fn_get_affiliate_stats()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'referral_code', (select referral_code from public.profiles where id = auth.uid()),
    'total_referrals', (select count(*) from public.profiles where referred_by = auth.uid()),
    'active_players', (
      select count(distinct wt.user_id) from public.wallet_transactions wt
      join public.profiles p on p.id = wt.user_id
      where p.referred_by = auth.uid() and wt.created_at > now() - interval '30 days'
    ),
    'total_commission', coalesce((select sum(amount) from public.affiliate_commissions where affiliate_id = auth.uid()), 0),
    'pending_commission', coalesce((select sum(amount) from public.affiliate_commissions where affiliate_id = auth.uid() and status = 'pending'), 0)
  );
$$;

grant execute on function public.fn_get_affiliate_stats() to authenticated;

create or replace function public.fn_get_recent_referrals(p_limit int default 10)
returns table (
  id uuid,
  full_name text,
  created_at timestamptz,
  status public.account_status,
  commission numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.full_name, p.created_at, p.status,
    coalesce((select sum(ac.amount) from public.affiliate_commissions ac where ac.referred_user_id = p.id), 0)
  from public.profiles p
  where p.referred_by = auth.uid()
  order by p.created_at desc
  limit p_limit;
$$;

grant execute on function public.fn_get_recent_referrals(int) to authenticated;

create or replace function public.fn_get_admin_stats()
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return json_build_object(
    'total_users', (select count(*) from public.profiles where role = 'user'),
    'active_users', (select count(*) from public.profiles where role = 'user' and last_login_at > now() - interval '30 days'),
    'total_deposits', coalesce((select sum(amount) from public.deposits where status = 'completed'), 0),
    'total_withdrawals', coalesce((select sum(amount) from public.withdrawals where status = 'completed'), 0),
    'pending_withdrawals', (select count(*) from public.withdrawals where status = 'pending')
  );
end;
$$;

grant execute on function public.fn_get_admin_stats() to authenticated;

create or replace function public.fn_get_admin_activity(p_limit int default 10)
returns table (
  kind text,
  label text,
  amount numeric,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select * from (
    (
      select 'new_user'::text as kind, p.full_name as label, null::numeric as amount, p.created_at
      from public.profiles p
      order by p.created_at desc
      limit p_limit
    )
    union all
    (
      select 'deposit'::text, pr.full_name, d.amount, d.created_at
      from public.deposits d join public.profiles pr on pr.id = d.user_id
      where d.status = 'completed'
      order by d.created_at desc
      limit p_limit
    )
    union all
    (
      select 'withdrawal'::text, pr.full_name, w.amount, w.requested_at
      from public.withdrawals w join public.profiles pr on pr.id = w.user_id
      order by w.requested_at desc
      limit p_limit
    )
  ) activity
  order by created_at desc
  limit p_limit;
end;
$$;

grant execute on function public.fn_get_admin_activity(int) to authenticated;

create or replace function public.fn_get_pending_withdrawals(p_limit int default 20)
returns table (
  id uuid,
  user_id uuid,
  full_name text,
  amount numeric,
  method public.payment_method,
  destination jsonb,
  requested_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select w.id, w.user_id, p.full_name, w.amount, w.method, w.destination, w.requested_at
  from public.withdrawals w
  join public.profiles p on p.id = w.user_id
  where w.status = 'pending'
  order by w.requested_at asc
  limit p_limit;
end;
$$;

grant execute on function public.fn_get_pending_withdrawals(int) to authenticated;

create or replace function public.fn_get_super_admin_stats()
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;

  return json_build_object(
    'total_users', (select count(*) from public.profiles),
    'total_operators', (select count(*) from public.profiles where role in ('admin', 'super_admin')),
    'total_deposits', coalesce((select sum(amount) from public.deposits where status = 'completed'), 0),
    'total_withdrawals', coalesce((select sum(amount) from public.withdrawals where status = 'completed'), 0),
    'platform_profit', coalesce((
      select sum(
        case
          when type = 'bet_stake' then amount
          when type in ('bet_payout', 'bonus_credit') then -amount
          else 0
        end
      )
      from public.wallet_transactions where status = 'completed'
    ), 0)
  );
end;
$$;

grant execute on function public.fn_get_super_admin_stats() to authenticated;

create or replace function public.fn_get_deposits_vs_withdrawals(p_days int default 14)
returns table (day date, deposits numeric, withdrawals numeric)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    d::date as day,
    coalesce((
      select sum(dep.amount) from public.deposits dep
      where dep.status = 'completed' and dep.completed_at::date = d::date
    ), 0) as deposits,
    coalesce((
      select sum(w.amount) from public.withdrawals w
      where w.status = 'completed' and w.completed_at::date = d::date
    ), 0) as withdrawals
  from generate_series(current_date - (p_days - 1), current_date, interval '1 day') as d
  order by day;
end;
$$;

grant execute on function public.fn_get_deposits_vs_withdrawals(int) to authenticated;

create or replace function public.fn_get_top_games(p_limit int default 5)
returns table (game_key text, title text, turnover numeric)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select s.game_key, coalesce(cg.title, s.game_key) as title, sum(r.stake) as turnover
  from public.casino_demo_crash_rounds r
  join public.casino_demo_sessions s on s.id = r.session_id
  left join public.casino_games cg on cg.game_key = s.game_key
  group by s.game_key, cg.title
  order by turnover desc
  limit p_limit;
end;
$$;

grant execute on function public.fn_get_top_games(int) to authenticated;
