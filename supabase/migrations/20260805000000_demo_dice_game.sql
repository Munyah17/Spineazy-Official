-- Spineazy: in-house "Roll the Dice" originals game (demo/practice mode).
--
-- This is real money-adjacent game logic, not aggregator content, so it's
-- provably fair: the server commits to a secret seed (publishes its SHA-256
-- hash) before any rolls are made against it, rolls are derived via
-- HMAC-SHA256(server_seed, "client_seed:nonce"), and the seed is revealed
-- (and archived) when the player rotates it -- letting anyone recompute and
-- verify every past roll. The exact same algorithm lives in
-- src/lib/games/provably-fair.ts and runs identically in the API route
-- below and in the client-side mock-mode simulation.
--
-- Demo/practice only for now (plays against casino_demo_sessions.demo_balance,
-- never wallets.balance) -- see casino_demo_crash_rounds migration for why
-- real-money in-house games are deliberately kept separate from the
-- eventual SoftGamings aggregator integration.

alter table public.casino_demo_sessions
  add column server_seed text,
  add column server_seed_hash text,
  add column client_seed text,
  add column nonce integer not null default 0;

-- casino_demo_sessions already has a "select own or admin" RLS policy from
-- the crash-game migration -- that's row-level only, so without this the
-- owning player could SELECT their own server_seed straight from the
-- browser and predict every future roll. Column-level grants close that:
-- the secret seed is only ever readable via the service-role client in the
-- API routes below.
revoke select on public.casino_demo_sessions from authenticated;
grant select (id, user_id, game_key, demo_balance, server_seed_hash, client_seed, nonce, created_at, updated_at)
  on public.casino_demo_sessions to authenticated;

create table public.casino_demo_dice_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.casino_demo_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  server_seed_hash text not null,
  client_seed text not null,
  nonce integer not null,
  roll numeric(5,2) not null check (roll >= 0 and roll < 100),
  target numeric(5,2) not null,
  direction text not null check (direction in ('under', 'over')),
  bet_amount numeric(14,2) not null check (bet_amount > 0),
  multiplier numeric(10,4) not null,
  payout numeric(14,2) not null default 0,
  status text not null check (status in ('won', 'lost')),
  created_at timestamptz not null default now()
);

create index casino_demo_dice_rounds_session_idx on public.casino_demo_dice_rounds (session_id, created_at);
create index casino_demo_dice_rounds_user_idx on public.casino_demo_dice_rounds (user_id);

-- Revealed seeds, archived on rotation so every past round stays verifiable
-- even after the session moves on to a new secret seed.
create table public.casino_demo_seed_reveals (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.casino_demo_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  server_seed text not null,
  server_seed_hash text not null,
  client_seed text not null,
  rounds_used integer not null,
  revealed_at timestamptz not null default now()
);

create index casino_demo_seed_reveals_session_idx on public.casino_demo_seed_reveals (session_id);

alter table public.casino_demo_dice_rounds enable row level security;
alter table public.casino_demo_seed_reveals enable row level security;

create policy "casino_demo_dice_rounds_select_own_or_admin" on public.casino_demo_dice_rounds
  for select using (user_id = auth.uid() or public.is_admin());

create policy "casino_demo_seed_reveals_select_own_or_admin" on public.casino_demo_seed_reveals
  for select using (user_id = auth.uid() or public.is_admin());

grant select on public.casino_demo_dice_rounds to authenticated;
grant select on public.casino_demo_seed_reveals to authenticated;

-- All writes (session/seed creation, bet resolution, seed rotation) happen
-- server-side via the service-role client in src/app/api/casino/demo/dice/*
-- so the secret seed never touches the client until it's revealed.
