-- Spineazy: self-serve responsible-gaming tools -- deposit limits and
-- self-exclusion, enforced server-side at deposit time (fn_check_deposit_allowed
-- is called from the EcoCash/Paynow deposit routes before charging).

create table if not exists public.responsible_gaming_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  daily_deposit_limit numeric,
  weekly_deposit_limit numeric,
  monthly_deposit_limit numeric,
  self_exclude_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.responsible_gaming_limits enable row level security;

drop policy if exists rgl_select_own on public.responsible_gaming_limits;
create policy rgl_select_own on public.responsible_gaming_limits
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create or replace function public.fn_set_deposit_limits(
  p_daily numeric,
  p_weekly numeric,
  p_monthly numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.responsible_gaming_limits (user_id, daily_deposit_limit, weekly_deposit_limit, monthly_deposit_limit, updated_at)
  values (auth.uid(), p_daily, p_weekly, p_monthly, now())
  on conflict (user_id) do update set
    daily_deposit_limit = excluded.daily_deposit_limit,
    weekly_deposit_limit = excluded.weekly_deposit_limit,
    monthly_deposit_limit = excluded.monthly_deposit_limit,
    updated_at = now();
end;
$$;

grant execute on function public.fn_set_deposit_limits(numeric, numeric, numeric) to authenticated;

-- Self-exclusion is intentionally one-directional from the player's side --
-- extending it is self-serve, lifting it early requires contacting support
-- (an admin can update responsible_gaming_limits directly).
create or replace function public.fn_set_self_exclusion(p_days int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_days is null or p_days <= 0 then
    raise exception 'Self-exclusion must be at least 1 day';
  end if;

  insert into public.responsible_gaming_limits (user_id, self_exclude_until, updated_at)
  values (auth.uid(), now() + make_interval(days => p_days), now())
  on conflict (user_id) do update set
    self_exclude_until = greatest(coalesce(public.responsible_gaming_limits.self_exclude_until, now()), now() + make_interval(days => p_days)),
    updated_at = now();
end;
$$;

grant execute on function public.fn_set_self_exclusion(int) to authenticated;

-- Called server-side (service role, explicit p_user_id) from the deposit
-- routes, and optionally by a signed-in user checking their own status.
create or replace function public.fn_check_deposit_allowed(p_user_id uuid, p_amount numeric)
returns table(allowed boolean, reason text)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_limits record;
  v_total numeric;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id and not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_limits from public.responsible_gaming_limits where user_id = p_user_id;

  if v_limits.self_exclude_until is not null and v_limits.self_exclude_until > now() then
    return query select false, 'You have self-excluded until ' || to_char(v_limits.self_exclude_until, 'YYYY-MM-DD');
    return;
  end if;

  if v_limits.daily_deposit_limit is not null then
    select coalesce(sum(amount), 0) into v_total from public.deposits
      where user_id = p_user_id and status = 'completed' and created_at > now() - interval '1 day';
    if v_total + p_amount > v_limits.daily_deposit_limit then
      return query select false, 'This would exceed your daily deposit limit';
      return;
    end if;
  end if;

  if v_limits.weekly_deposit_limit is not null then
    select coalesce(sum(amount), 0) into v_total from public.deposits
      where user_id = p_user_id and status = 'completed' and created_at > now() - interval '7 days';
    if v_total + p_amount > v_limits.weekly_deposit_limit then
      return query select false, 'This would exceed your weekly deposit limit';
      return;
    end if;
  end if;

  if v_limits.monthly_deposit_limit is not null then
    select coalesce(sum(amount), 0) into v_total from public.deposits
      where user_id = p_user_id and status = 'completed' and created_at > now() - interval '30 days';
    if v_total + p_amount > v_limits.monthly_deposit_limit then
      return query select false, 'This would exceed your monthly deposit limit';
      return;
    end if;
  end if;

  return query select true, null::text;
end;
$$;

grant execute on function public.fn_check_deposit_allowed(uuid, numeric) to authenticated, service_role;
