-- Spineazy: demo-mode crash game round tracking.
--
-- This is deliberately separate from the real-money `casino_games` /
-- `casino_sessions` tables that already exist in the shared schema (set up
-- for the eventual licensed SoftGamings aggregator integration). Until that
-- integration lands, the built-in crash game only ever plays against fake
-- demo credits tracked here -- it never touches `wallets.balance`. Building
-- an in-house real-money game engine is exactly what the licensed aggregator
-- is for; this table exists purely to make the demo playable end-to-end.

create table public.casino_demo_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_key text not null,
  demo_balance numeric(14,2) not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_key)
);

create table public.casino_demo_crash_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.casino_demo_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stake numeric(14,2) not null check (stake > 0),
  crash_point numeric(10,2) not null check (crash_point >= 1.00),
  cashed_out_at numeric(10,2),
  payout numeric(14,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'cashed_out', 'crashed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index casino_demo_crash_rounds_session_idx on public.casino_demo_crash_rounds (session_id);
create index casino_demo_crash_rounds_user_idx on public.casino_demo_crash_rounds (user_id);

alter table public.casino_demo_sessions enable row level security;
alter table public.casino_demo_crash_rounds enable row level security;

-- Reads only for the owning player (or admins). All writes (session
-- creation, bet placement, round resolution) happen server-side via the
-- service-role client so the crash point can be generated server-side and
-- never trusted from the client.
create policy "casino_demo_sessions_select_own_or_admin" on public.casino_demo_sessions
  for select using (user_id = auth.uid() or public.is_admin());

create policy "casino_demo_crash_rounds_select_own_or_admin" on public.casino_demo_crash_rounds
  for select using (user_id = auth.uid() or public.is_admin());

grant select on public.casino_demo_sessions to authenticated;
grant select on public.casino_demo_crash_rounds to authenticated;
