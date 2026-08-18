-- Spineazy: player <-> admin support ticket system. Separate from the
-- peer-to-peer Chat & Pay feature (chat_threads/chat_messages), which stays
-- player-to-player only.

do $$ begin
  create type public.support_ticket_status as enum ('open', 'pending', 'closed');
exception when duplicate_object then null; end $$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  status public.support_ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  is_admin_reply boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.support_messages enable row level security;
create index if not exists support_messages_ticket_idx on public.support_messages (ticket_id, created_at);

-- tickets: owner + any admin
drop policy if exists support_tickets_select on public.support_tickets;
create policy support_tickets_select on public.support_tickets
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists support_tickets_insert on public.support_tickets;
create policy support_tickets_insert on public.support_tickets
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists support_tickets_update on public.support_tickets;
create policy support_tickets_update on public.support_tickets
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

revoke update on public.support_tickets from authenticated;
grant select, insert on public.support_tickets to authenticated;
grant update (status) on public.support_tickets to authenticated;

-- messages: anyone who can see the parent ticket
drop policy if exists support_messages_select on public.support_messages;
create policy support_messages_select on public.support_messages
  for select to authenticated
  using (
    exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin()))
  );

drop policy if exists support_messages_insert on public.support_messages;
create policy support_messages_insert on public.support_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin()))
  );

grant select, insert on public.support_messages to authenticated;

-- A new message bumps the ticket and flips status: admin replies mark it
-- "pending" (waiting on the player), player replies re-open it.
create or replace function public.fn_touch_support_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.support_tickets
  set updated_at = now(),
      status = case when new.is_admin_reply then 'pending' else 'open' end
  where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_support_ticket on public.support_messages;
create trigger trg_touch_support_ticket
  after insert on public.support_messages
  for each row execute function public.fn_touch_support_ticket();

-- Convenience RPC so the client can create a ticket + first message in one
-- round trip without two separate inserts racing RLS.
create or replace function public.fn_open_support_ticket(p_subject text, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket_id uuid;
begin
  insert into public.support_tickets (user_id, subject) values (auth.uid(), p_subject) returning id into v_ticket_id;
  insert into public.support_messages (ticket_id, sender_id, is_admin_reply, body) values (v_ticket_id, auth.uid(), false, p_body);
  return v_ticket_id;
end;
$$;

grant execute on function public.fn_open_support_ticket(text, text) to authenticated;

-- Admin console list view: latest message preview per ticket.
create or replace function public.fn_get_support_tickets(p_status public.support_ticket_status default null, p_limit int default 50)
returns table (
  id uuid,
  user_id uuid,
  full_name text,
  subject text,
  status public.support_ticket_status,
  created_at timestamptz,
  updated_at timestamptz,
  last_message text
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
  select t.id, t.user_id, p.full_name, t.subject, t.status, t.created_at, t.updated_at,
    (select m.body from public.support_messages m where m.ticket_id = t.id order by m.created_at desc limit 1)
  from public.support_tickets t
  join public.profiles p on p.id = t.user_id
  where p_status is null or t.status = p_status
  order by t.updated_at desc
  limit p_limit;
end;
$$;

grant execute on function public.fn_get_support_tickets(public.support_ticket_status, int) to authenticated;
