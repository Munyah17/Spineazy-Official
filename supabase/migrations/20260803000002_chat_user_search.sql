-- Spineazy: search players by name to start a Chat & Pay conversation.
-- Replaces the referral-code-only chat starter -- referral codes are for
-- affiliate attribution, not for finding a friend to chat with.

create or replace function public.fn_search_users(p_query text, p_limit int default 8)
returns table (id uuid, full_name text, avatar_url text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.full_name, p.avatar_url
  from public.profiles p
  where p.id != auth.uid()
    and length(trim(p_query)) >= 2
    and (
      p.full_name ilike '%' || trim(p_query) || '%'
      or p.id::text = trim(p_query)
    )
  order by p.full_name
  limit p_limit;
$$;

grant execute on function public.fn_search_users(text, int) to authenticated;
