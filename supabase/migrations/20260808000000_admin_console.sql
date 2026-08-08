-- Spineazy: admin console backend -- grant the named super admin account and
-- add a user-directory RPC for the console's Users tool.

-- Idempotent: no-op if these emails haven't signed up yet, safe to re-run.
update public.profiles
set role = 'super_admin'
where email = 'munyamuzvidziwa19@gmail.com';

update public.profiles
set role = 'admin'
where email = 'munyah777@gmail.com';

create or replace function public.fn_get_users(p_search text default null, p_limit int default 50)
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  role public.user_role,
  status public.account_status,
  created_at timestamptz,
  last_login_at timestamptz,
  balance numeric
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
  select p.id, p.full_name, p.email, p.phone, p.role, p.status, p.created_at, p.last_login_at,
         coalesce(w.balance, 0) as balance
  from public.profiles p
  left join public.wallets w on w.user_id = p.id
  where p_search is null or length(trim(p_search)) = 0
    or p.full_name ilike '%' || trim(p_search) || '%'
    or p.email ilike '%' || trim(p_search) || '%'
    or p.phone ilike '%' || trim(p_search) || '%'
  order by p.created_at desc
  limit p_limit;
end;
$$;

grant execute on function public.fn_get_users(text, int) to authenticated;

create or replace function public.fn_set_user_status(p_user_id uuid, p_status public.account_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Cannot change your own status';
  end if;

  update public.profiles set status = p_status where id = p_user_id;
end;
$$;

grant execute on function public.fn_set_user_status(uuid, public.account_status) to authenticated;
