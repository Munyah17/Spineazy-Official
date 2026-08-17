-- Spineazy: security hardening -- DB-backed rate limiting (serverless-safe,
-- no external service needed), webhook idempotency ledger, and an admin
-- action audit log. Additive only; safe to re-run.

create table if not exists public.rate_limit_hits (
  id bigserial primary key,
  rkey text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_hits_key_time_idx on public.rate_limit_hits (rkey, created_at desc);
alter table public.rate_limit_hits enable row level security;
-- No policies granted to anon/authenticated -- only reachable via the
-- SECURITY DEFINER function below, which the service role and clients call
-- through supabase.rpc(). Row ownership doesn't apply to this table.

create or replace function public.fn_check_rate_limit(p_key text, p_max_attempts int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from public.rate_limit_hits where created_at < now() - make_interval(secs => greatest(p_window_seconds, 60) * 4);

  select count(*) into v_count
  from public.rate_limit_hits
  where rkey = p_key and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max_attempts then
    return false;
  end if;

  insert into public.rate_limit_hits (rkey) values (p_key);
  return true;
end;
$$;

grant execute on function public.fn_check_rate_limit(text, int, int) to anon, authenticated;

-- Idempotency ledger for external webhook callbacks (aggregators/payment
-- providers retry on timeout -- replaying a transaction id must be a no-op).
create table if not exists public.webhook_events (
  provider text not null,
  transaction_id text not null,
  action text not null,
  created_at timestamptz not null default now(),
  primary key (provider, transaction_id, action)
);
alter table public.webhook_events enable row level security;
-- No policies -- written only via the service-role key from webhook routes.

-- Admin action audit log: who approved/rejected/suspended what, and when.
create table if not exists public.admin_audit_log (
  id bigserial primary key,
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;

drop policy if exists admin_audit_log_select_admin on public.admin_audit_log;
create policy admin_audit_log_select_admin on public.admin_audit_log
  for select to authenticated
  using (public.is_admin());

create or replace function public.fn_log_admin_action(
  p_action text,
  p_target_type text,
  p_target_id uuid default null,
  p_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, meta)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_meta);
end;
$$;

grant execute on function public.fn_log_admin_action(text, text, uuid, jsonb) to authenticated;

create or replace function public.fn_get_admin_audit_log(p_limit int default 100)
returns table (
  id bigint,
  admin_id uuid,
  admin_name text,
  action text,
  target_type text,
  target_id uuid,
  meta jsonb,
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
  select l.id, l.admin_id, p.full_name, l.action, l.target_type, l.target_id, l.meta, l.created_at
  from public.admin_audit_log l
  join public.profiles p on p.id = l.admin_id
  order by l.created_at desc
  limit p_limit;
end;
$$;

grant execute on function public.fn_get_admin_audit_log(int) to authenticated;
