-- Spineazy: reconstructed base schema.
--
-- CONTEXT: this project's foundational tables and RPC functions (profiles,
-- wallets, wallet_transactions, deposits, withdrawals, the sportsbook
-- tables, is_admin()/is_super_admin(), fn_wallet_credit/debit, etc.) were
-- created by hand directly against a hosted Supabase project, before this
-- repo tracked migrations. That hosted project turned out to be a
-- placeholder that was never actually created (see chat history 2026-08-18)
-- -- so the original SQL is unrecoverable. Every migration added after
-- 2026-07-25 assumes this foundation already exists (e.g. 20260802000000
-- calls public.is_admin() and reads public.profiles/deposits/withdrawals
-- without ever defining them).
--
-- This migration reconstructs that foundation from two sources: the
-- hand-maintained src/types/database.ts (column names/types/nullability)
-- and how the application code actually calls each table/RPC (argument
-- shapes, expected return fields). Business logic for functions that were
-- never fully documented (bet settlement math, cash-out pricing) is a
-- best-effort implementation, not a byte-exact recovery -- flagged inline
-- where it's a judgment call.
--
-- Three type declarations in database.ts were NOT reconstructed here
-- because nothing in the app calls them: create_staff_member,
-- custom_access_token_hook, and get_my_school_id. The last one in
-- particular looks like leftover cruft from an unrelated project template
-- ("school_id" has no connection to a casino app) -- flagging rather than
-- inventing fake functionality for it.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists pg_trgm;

-- ============================================================================
-- Enums
-- ============================================================================
create type public.account_status as enum ('active', 'suspended', 'banned');
create type public.user_role as enum ('user', 'admin', 'super_admin');
create type public.banner_accent as enum ('primary', 'boost', 'info');
create type public.banner_kind as enum ('hero_slide', 'announcement');
create type public.payment_method as enum (
  'ecocash', 'onemoney', 'innbucks', 'omari', 'mukuru', 'visa', 'mastercard', 'bank_transfer'
);
create type public.deposit_status as enum ('pending', 'processing', 'completed', 'failed', 'cancelled');
create type public.withdrawal_status as enum (
  'pending', 'approved', 'processing', 'completed', 'rejected', 'failed'
);
create type public.wallet_tx_status as enum ('pending', 'completed', 'failed', 'reversed');
create type public.wallet_tx_type as enum (
  'deposit', 'withdrawal', 'bet_stake', 'bet_payout', 'bet_refund',
  'bonus_credit', 'bonus_debit', 'cashout', 'adjustment', 'booking_release'
);
create type public.notification_type as enum (
  'bet_won', 'bet_lost', 'bet_settled', 'deposit', 'withdrawal', 'bonus', 'promo', 'system'
);
create type public.promo_type as enum (
  'welcome_bonus', 'deposit_bonus', 'free_bet', 'odds_boost', 'cashback'
);
create type public.bonus_status as enum ('active', 'completed', 'expired', 'forfeited');
create type public.casino_mode as enum ('demo', 'real');
create type public.fixture_status as enum ('upcoming', 'live', 'finished', 'cancelled', 'postponed');
create type public.market_status as enum ('open', 'suspended', 'closed');
create type public.selection_status as enum ('pending', 'won', 'lost', 'void');
create type public.bet_type as enum ('single', 'multiple', 'system');
create type public.bet_status as enum ('open', 'won', 'lost', 'void', 'cashed_out', 'partially_cashed_out');
create type public.booked_bet_status as enum ('active', 'loaded', 'expired', 'cancelled');

-- ============================================================================
-- profiles + wallets (auto-created on signup)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  avatar_url text,
  country text,
  date_of_birth date,
  role public.user_role not null default 'user',
  status public.account_status not null default 'active',
  referral_code text unique,
  referred_by uuid references public.profiles(id),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_referred_by_idx on public.profiles (referred_by);
create index profiles_email_idx on public.profiles (email);
create index profiles_phone_idx on public.profiles (phone);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  bonus_balance numeric(14,2) not null default 0,
  locked_balance numeric(14,2) not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  type public.wallet_tx_type not null,
  status public.wallet_tx_status not null default 'completed',
  amount numeric(14,2) not null,
  balance_before numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  reference_id text,
  reference_type text,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index wallet_transactions_user_idx on public.wallet_transactions (user_id, created_at desc);
create index wallet_transactions_wallet_idx on public.wallet_transactions (wallet_id);

-- Auto-provision a profile + wallet whenever a new auth user is created.
-- Referral code: 8-char uppercase alphanumeric, regenerated on the rare
-- collision (unique constraint on profiles.referral_code).
create or replace function public.fn_generate_referral_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    select exists(select 1 from public.profiles where referral_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, referral_code, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'player'), '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    public.fn_generate_referral_code(),
    nullif(new.raw_user_meta_data->>'referred_by', '')::uuid
  );

  insert into public.wallets (user_id) values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Role helpers -- every SECURITY DEFINER admin RPC in this repo gates on
-- these, so they must exist before any later migration runs.
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

-- ============================================================================
-- Wallet ledger primitives -- every balance mutation in the app goes
-- through these two functions (see 20260803000001's fund-split trigger,
-- which derives deposited_balance/profit_balance from what these write).
-- ============================================================================
create or replace function public.fn_wallet_credit(
  p_user_id uuid,
  p_amount numeric,
  p_type public.wallet_tx_type,
  p_reference_id text,
  p_reference_type text,
  p_description text,
  p_created_by uuid default null,
  p_status public.wallet_tx_status default 'completed'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet record;
  v_tx_id uuid;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select id, balance into v_wallet from public.wallets where user_id = p_user_id for update;
  if v_wallet is null then
    raise exception 'Wallet not found for user %', p_user_id;
  end if;

  insert into public.wallet_transactions
    (user_id, wallet_id, type, status, amount, balance_before, balance_after,
     reference_id, reference_type, description, created_by)
  values
    (p_user_id, v_wallet.id, p_type, p_status, p_amount, v_wallet.balance, v_wallet.balance + p_amount,
     p_reference_id, p_reference_type, p_description, p_created_by)
  returning id into v_tx_id;

  if p_status = 'completed' then
    update public.wallets set balance = balance + p_amount, updated_at = now() where id = v_wallet.id;
  end if;

  return v_tx_id;
end;
$$;

grant execute on function public.fn_wallet_credit(uuid, numeric, public.wallet_tx_type, text, text, text, uuid, public.wallet_tx_status) to authenticated, service_role;

create or replace function public.fn_wallet_debit(
  p_user_id uuid,
  p_amount numeric,
  p_type public.wallet_tx_type,
  p_reference_id text,
  p_reference_type text,
  p_description text,
  p_created_by uuid default null,
  p_status public.wallet_tx_status default 'completed'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet record;
  v_tx_id uuid;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select id, balance into v_wallet from public.wallets where user_id = p_user_id for update;
  if v_wallet is null then
    raise exception 'Wallet not found for user %', p_user_id;
  end if;
  if v_wallet.balance < p_amount then
    raise exception 'insufficient_balance';
  end if;

  insert into public.wallet_transactions
    (user_id, wallet_id, type, status, amount, balance_before, balance_after,
     reference_id, reference_type, description, created_by)
  values
    (p_user_id, v_wallet.id, p_type, p_status, -p_amount, v_wallet.balance, v_wallet.balance - p_amount,
     p_reference_id, p_reference_type, p_description, p_created_by)
  returning id into v_tx_id;

  if p_status = 'completed' then
    update public.wallets set balance = balance - p_amount, updated_at = now() where id = v_wallet.id;
  end if;

  return v_tx_id;
end;
$$;

grant execute on function public.fn_wallet_debit(uuid, numeric, public.wallet_tx_type, text, text, text, uuid, public.wallet_tx_status) to authenticated, service_role;

-- ============================================================================
-- Deposits
-- ============================================================================
create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'USD',
  method public.payment_method not null,
  provider text not null default 'manual',
  provider_transaction_id text,
  provider_payload jsonb,
  phone_number text,
  paynow_reference text,
  paynow_poll_url text,
  client_correlator text,
  status public.deposit_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index deposits_user_idx on public.deposits (user_id, created_at desc);
create index deposits_status_idx on public.deposits (status);

create or replace function public.fn_complete_deposit(p_deposit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deposit record;
begin
  select * into v_deposit from public.deposits where id = p_deposit_id for update;
  if v_deposit is null then
    raise exception 'Deposit not found';
  end if;
  if v_deposit.status = 'completed' then
    return; -- idempotent: webhook retries are a no-op
  end if;

  update public.deposits set status = 'completed', completed_at = now(), updated_at = now()
  where id = p_deposit_id;

  perform public.fn_wallet_credit(
    p_user_id := v_deposit.user_id,
    p_amount := v_deposit.amount,
    p_type := 'deposit',
    p_reference_id := v_deposit.id::text,
    p_reference_type := 'deposit',
    p_description := 'Deposit via ' || v_deposit.method::text
  );
end;
$$;

grant execute on function public.fn_complete_deposit(uuid) to authenticated, service_role;

create or replace function public.fn_fail_deposit(p_deposit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.deposits set status = 'failed', updated_at = now()
  where id = p_deposit_id and status <> 'completed';
end;
$$;

grant execute on function public.fn_fail_deposit(uuid) to authenticated, service_role;

-- ============================================================================
-- Withdrawals -- funds are locked (debited) at request time so a user can't
-- double-spend a pending withdrawal; fn_guard_withdrawal_request (already
-- defined in 20260803000001) is called by the client before this.
-- ============================================================================
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'USD',
  method public.payment_method not null,
  destination jsonb not null,
  status public.withdrawal_status not null default 'pending',
  provider_reference text,
  rejection_reason text,
  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  completed_at timestamptz
);

create index withdrawals_user_idx on public.withdrawals (user_id, requested_at desc);
create index withdrawals_status_idx on public.withdrawals (status);

create or replace function public.fn_request_withdrawal(p_amount numeric, p_destination jsonb, p_method public.payment_method)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_withdrawal_id uuid;
begin
  select id into v_wallet_id from public.wallets where user_id = auth.uid();
  if v_wallet_id is null then
    raise exception 'Wallet not found';
  end if;

  insert into public.withdrawals (user_id, wallet_id, amount, method, destination)
  values (auth.uid(), v_wallet_id, p_amount, p_method, p_destination)
  returning id into v_withdrawal_id;

  perform public.fn_wallet_debit(
    p_user_id := auth.uid(),
    p_amount := p_amount,
    p_type := 'withdrawal',
    p_reference_id := v_withdrawal_id::text,
    p_reference_type := 'withdrawal',
    p_description := 'Withdrawal requested'
  );

  return v_withdrawal_id;
end;
$$;

grant execute on function public.fn_request_withdrawal(numeric, jsonb, public.payment_method) to authenticated;

create or replace function public.fn_approve_withdrawal(p_withdrawal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.withdrawals
  set status = 'completed', completed_at = now(), reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_withdrawal_id and status = 'pending';

  if not found then
    raise exception 'Withdrawal not found or already reviewed';
  end if;
end;
$$;

grant execute on function public.fn_approve_withdrawal(uuid) to authenticated;

-- Refunds the locked amount back to the user's withdrawable balance.
-- NOTE: relies on the fund-split trigger treating a positive-delta
-- 'withdrawal' transaction as a refund into profit_balance -- see
-- 20260818000000_fix_withdrawal_refund_split.sql, which patches that
-- trigger (it originally only handled the negative/debit case).
create or replace function public.fn_reject_withdrawal(p_withdrawal_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_withdrawal record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_withdrawal from public.withdrawals where id = p_withdrawal_id for update;
  if v_withdrawal is null or v_withdrawal.status <> 'pending' then
    raise exception 'Withdrawal not found or already reviewed';
  end if;

  update public.withdrawals
  set status = 'rejected', rejection_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_withdrawal_id;

  perform public.fn_wallet_credit(
    p_user_id := v_withdrawal.user_id,
    p_amount := v_withdrawal.amount,
    p_type := 'withdrawal',
    p_reference_id := v_withdrawal.id::text,
    p_reference_type := 'withdrawal_refund',
    p_description := 'Withdrawal rejected: ' || p_reason
  );
end;
$$;

grant execute on function public.fn_reject_withdrawal(uuid, text) to authenticated;

-- ============================================================================
-- Content: banners, casino games/sessions, notifications, promotions
-- ============================================================================
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  kind public.banner_kind not null,
  accent public.banner_accent not null default 'primary',
  title text not null,
  description text,
  eyebrow text,
  image_url text,
  cta_label text,
  cta_href text,
  display_order int not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.casino_games (
  id uuid primary key default gen_random_uuid(),
  game_key text not null unique,
  title text not null,
  provider text not null default 'spribe',
  category text,
  thumbnail_url text,
  rtp numeric(5,2),
  demo_available boolean not null default true,
  active boolean not null default true,
  display_order int not null default 0
);

create table public.casino_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.casino_games(id) on delete cascade,
  mode public.casino_mode not null,
  session_token text not null unique,
  balance_snapshot numeric(14,2),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index casino_sessions_user_idx on public.casino_sessions (user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  reference_id text,
  reference_type text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  type public.promo_type not null,
  title text not null,
  description text,
  terms text,
  banner_url text,
  value numeric(14,2),
  min_odds numeric(6,2),
  min_selections int,
  wagering_requirement numeric(6,2),
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.user_bonuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  promotion_id uuid references public.promotions(id) on delete set null,
  amount numeric(14,2) not null,
  wagering_required numeric(14,2) not null default 0,
  wagering_progress numeric(14,2) not null default 0,
  status public.bonus_status not null default 'active',
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index user_bonuses_user_idx on public.user_bonuses (user_id);

-- ============================================================================
-- Sportsbook schema -- not currently wired to any UI (the app links out to
-- an external sportsbook, see SPORTSBOOK_URL), kept for schema completeness
-- since src/types/database.ts declares full CRUD types for these tables.
-- ============================================================================
create table public.sport_groups (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  icon text,
  display_order int not null default 0,
  active boolean not null default true
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  sport_group_id uuid not null references public.sport_groups(id) on delete cascade,
  title text not null,
  region text,
  odds_api_key text not null,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  home_team text not null,
  away_team text not null,
  home_score int,
  away_score int,
  minute int,
  commence_time timestamptz not null,
  status public.fixture_status not null default 'upcoming',
  is_featured boolean not null default false,
  odds_api_event_id text,
  last_synced_at timestamptz,
  extra_markets_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fixtures_competition_idx on public.fixtures (competition_id);
create index fixtures_commence_idx on public.fixtures (commence_time);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  market_key text not null,
  market_name text not null,
  status public.market_status not null default 'open',
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index markets_fixture_idx on public.markets (fixture_id);

create table public.odds_outcomes (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  name text not null,
  bookmaker text not null default 'spineazy',
  price numeric(8,2) not null,
  point numeric(8,2),
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);

create index odds_outcomes_market_idx on public.odds_outcomes (market_id);

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  bet_type public.bet_type not null,
  stake numeric(14,2) not null check (stake > 0),
  base_total_odds numeric(10,2) not null,
  total_odds numeric(10,2) not null,
  potential_payout numeric(14,2) not null,
  system_size int,
  is_free_bet boolean not null default false,
  winboost_enabled boolean not null default false,
  winboost_pct numeric(5,2) not null default 0,
  status public.bet_status not null default 'open',
  cash_out_value numeric(14,2),
  cashed_out_at timestamptz,
  placement_group_id uuid not null default gen_random_uuid(),
  placed_at timestamptz not null default now(),
  settled_at timestamptz
);

create index bets_user_idx on public.bets (user_id, placed_at desc);

create table public.bet_selections (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  fixture_id uuid not null references public.fixtures(id),
  market_id uuid not null references public.markets(id),
  outcome_id uuid not null references public.odds_outcomes(id),
  fixture_label text not null,
  market_name text not null,
  selection_name text not null,
  odds_price numeric(8,2) not null,
  status public.selection_status not null default 'pending',
  settled_at timestamptz
);

create index bet_selections_bet_idx on public.bet_selections (bet_id);

create table public.booked_bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  bet_code text not null unique,
  bet_type public.bet_type not null,
  selections jsonb not null,
  total_odds numeric(10,2) not null,
  status public.booked_bet_status not null default 'active',
  load_count int not null default 0,
  loaded_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- ============================================================================
-- Generic audit trail (distinct from admin_audit_log, which is specifically
-- the admin-action log added in 20260817000000). Not currently written to
-- by any app code -- reserved for future generic change tracking.
-- ============================================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_role public.user_role,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

-- ============================================================================
-- Sportsbook RPCs -- dormant (no current UI calls these), implemented for
-- schema completeness. Cash-out pricing is a simple approximation (80% of
-- potential payout while a bet is open) since no live in-play odds feed
-- exists in this repo -- replace with real pricing before ever exposing this.
-- ============================================================================
create or replace function public.generate_bet_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    select exists(select 1 from public.booked_bets where bet_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

-- Helper used by fn_choose -- Postgres has no built-in ln(factorial(n)).
create or replace function public.ln_factorial(n int)
returns numeric
language sql
immutable
as $$
  select coalesce(sum(ln(i)), 0) from generate_series(2, n) as i;
$$;

create or replace function public.fn_choose(n int, k int)
returns numeric
language sql
immutable
as $$
  select case
    when k < 0 or k > n then 0
    else round(exp(public.ln_factorial(n) - public.ln_factorial(k) - public.ln_factorial(n - k)))
  end;
$$;

create or replace function public.fn_place_bet(
  p_bet_type public.bet_type,
  p_selections jsonb,
  p_stake numeric,
  p_system_size int default null,
  p_winboost boolean default false
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_total_odds numeric := 1;
  v_bet_id uuid;
  v_sel jsonb;
  v_potential numeric;
begin
  if p_stake <= 0 then
    raise exception 'Stake must be positive';
  end if;
  if jsonb_array_length(p_selections) = 0 then
    raise exception 'At least one selection is required';
  end if;

  select id into v_wallet_id from public.wallets where user_id = auth.uid();
  if v_wallet_id is null then
    raise exception 'Wallet not found';
  end if;

  for v_sel in select * from jsonb_array_elements(p_selections)
  loop
    v_total_odds := v_total_odds * (v_sel->>'odds_price')::numeric;
  end loop;

  v_potential := round(p_stake * v_total_odds, 2);

  insert into public.bets
    (user_id, wallet_id, bet_type, stake, base_total_odds, total_odds, potential_payout, system_size, winboost_enabled)
  values
    (auth.uid(), v_wallet_id, p_bet_type, p_stake, v_total_odds, v_total_odds, v_potential, p_system_size, p_winboost)
  returning id into v_bet_id;

  for v_sel in select * from jsonb_array_elements(p_selections)
  loop
    insert into public.bet_selections
      (bet_id, fixture_id, market_id, outcome_id, fixture_label, market_name, selection_name, odds_price)
    values
      (v_bet_id, (v_sel->>'fixture_id')::uuid, (v_sel->>'market_id')::uuid, (v_sel->>'outcome_id')::uuid,
       v_sel->>'fixture_label', v_sel->>'market_name', v_sel->>'selection_name', (v_sel->>'odds_price')::numeric);
  end loop;

  perform public.fn_wallet_debit(
    p_user_id := auth.uid(),
    p_amount := p_stake,
    p_type := 'bet_stake',
    p_reference_id := v_bet_id::text,
    p_reference_type := 'bet',
    p_description := 'Bet placed'
  );

  return json_build_object('bet_id', v_bet_id, 'total_odds', v_total_odds, 'potential_payout', v_potential);
end;
$$;

grant execute on function public.fn_place_bet(public.bet_type, jsonb, numeric, int, boolean) to authenticated;

create or replace function public.fn_book_bet(p_bet_type public.bet_type, p_selections jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_total_odds numeric := 1;
  v_sel jsonb;
  v_id uuid;
begin
  for v_sel in select * from jsonb_array_elements(p_selections)
  loop
    v_total_odds := v_total_odds * (v_sel->>'odds_price')::numeric;
  end loop;

  v_code := public.generate_bet_code();

  insert into public.booked_bets (user_id, bet_code, bet_type, selections, total_odds, expires_at)
  values (auth.uid(), v_code, p_bet_type, p_selections, v_total_odds, now() + interval '7 days')
  returning id into v_id;

  return json_build_object('id', v_id, 'bet_code', v_code);
end;
$$;

grant execute on function public.fn_book_bet(public.bet_type, jsonb) to authenticated;

create or replace function public.fn_load_booked_bet(p_bet_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booked record;
begin
  select * into v_booked from public.booked_bets where bet_code = p_bet_code for update;
  if v_booked is null then
    raise exception 'Bet code not found';
  end if;
  if v_booked.status <> 'active' or v_booked.expires_at < now() then
    raise exception 'Bet code expired or already used';
  end if;

  update public.booked_bets
  set load_count = load_count + 1, loaded_at = now(), status = 'loaded'
  where id = v_booked.id;

  return json_build_object('bet_type', v_booked.bet_type, 'selections', v_booked.selections, 'total_odds', v_booked.total_odds);
end;
$$;

grant execute on function public.fn_load_booked_bet(text) to authenticated;

create or replace function public.fn_expire_booked_bets()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.booked_bets set status = 'expired'
  where status = 'active' and expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.fn_expire_booked_bets() to service_role;

create or replace function public.fn_cash_out_preview(p_bet_id uuid)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_bet record;
  v_value numeric;
begin
  select * into v_bet from public.bets where id = p_bet_id and user_id = auth.uid();
  if v_bet is null then
    raise exception 'Bet not found';
  end if;
  if v_bet.status <> 'open' then
    raise exception 'Bet is not open';
  end if;

  v_value := round(v_bet.potential_payout * 0.8, 2);
  return json_build_object('cash_out_value', v_value);
end;
$$;

grant execute on function public.fn_cash_out_preview(uuid) to authenticated;

create or replace function public.fn_cash_out(p_bet_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet record;
  v_value numeric;
begin
  select * into v_bet from public.bets where id = p_bet_id and user_id = auth.uid() for update;
  if v_bet is null then
    raise exception 'Bet not found';
  end if;
  if v_bet.status <> 'open' then
    raise exception 'Bet is not open';
  end if;

  v_value := round(v_bet.potential_payout * 0.8, 2);

  update public.bets
  set status = 'cashed_out', cash_out_value = v_value, cashed_out_at = now(), settled_at = now()
  where id = p_bet_id;

  perform public.fn_wallet_credit(
    p_user_id := auth.uid(),
    p_amount := v_value,
    p_type := 'cashout',
    p_reference_id := p_bet_id::text,
    p_reference_type := 'bet',
    p_description := 'Bet cashed out'
  );

  return json_build_object('cash_out_value', v_value);
end;
$$;

grant execute on function public.fn_cash_out(uuid) to authenticated;

create or replace function public.fn_settle_selection(p_selection_id uuid, p_status public.selection_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.bet_selections set status = p_status, settled_at = now() where id = p_selection_id;
end;
$$;

grant execute on function public.fn_settle_selection(uuid, public.selection_status) to authenticated;

create or replace function public.fn_settle_bet(p_bet_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet record;
  v_pending int;
  v_lost int;
  v_final_status public.bet_status;
begin
  select * into v_bet from public.bets where id = p_bet_id for update;
  if v_bet is null then
    raise exception 'Bet not found';
  end if;
  if v_bet.status <> 'open' then
    return json_build_object('status', v_bet.status);
  end if;

  select count(*) filter (where status = 'pending') into v_pending from public.bet_selections where bet_id = p_bet_id;
  if v_pending > 0 then
    raise exception 'Not all selections are settled yet';
  end if;

  select count(*) filter (where status = 'lost') into v_lost from public.bet_selections where bet_id = p_bet_id;
  v_final_status := case when v_lost > 0 then 'lost' else 'won' end;

  update public.bets set status = v_final_status, settled_at = now() where id = p_bet_id;

  if v_final_status = 'won' then
    perform public.fn_wallet_credit(
      p_user_id := v_bet.user_id,
      p_amount := v_bet.potential_payout,
      p_type := 'bet_payout',
      p_reference_id := p_bet_id::text,
      p_reference_type := 'bet',
      p_description := 'Bet won'
    );
  end if;

  return json_build_object('status', v_final_status);
end;
$$;

grant execute on function public.fn_settle_bet(uuid) to authenticated;

-- ============================================================================
-- Sign-in-by-phone lookup -- needed pre-auth, so anon must be able to call it.
-- ============================================================================
create or replace function public.fn_lookup_email_by_phone(p_phone text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email from public.profiles where phone = p_phone limit 1;
$$;

grant execute on function public.fn_lookup_email_by_phone(text) to anon, authenticated;

-- ============================================================================
-- Row level security
-- ============================================================================
-- profiles/wallets/wallet_transactions/deposits/withdrawals: RLS + policies
-- are handled by 20260817000001_rls_baseline.sql, which runs after this
-- migration. Just enable RLS here so the tables aren't briefly wide open.
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;

alter table public.banners enable row level security;
create policy banners_select_public on public.banners for select using (active = true);
grant select on public.banners to anon, authenticated;

alter table public.casino_games enable row level security;
create policy casino_games_select_public on public.casino_games for select using (active = true);
grant select on public.casino_games to anon, authenticated;

alter table public.casino_sessions enable row level security;
create policy casino_sessions_select_own_or_admin on public.casino_sessions
  for select using (user_id = auth.uid() or public.is_admin());
grant select on public.casino_sessions to authenticated;

alter table public.notifications enable row level security;
create policy notifications_select_own on public.notifications for select using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update using (user_id = auth.uid());
grant select, update on public.notifications to authenticated;

alter table public.promotions enable row level security;
create policy promotions_select_public on public.promotions for select using (active = true);
grant select on public.promotions to anon, authenticated;

alter table public.user_bonuses enable row level security;
create policy user_bonuses_select_own on public.user_bonuses for select using (user_id = auth.uid());
create policy user_bonuses_insert_own on public.user_bonuses for insert with check (user_id = auth.uid());
grant select, insert on public.user_bonuses to authenticated;

alter table public.sport_groups enable row level security;
create policy sport_groups_select_public on public.sport_groups for select using (active = true);
grant select on public.sport_groups to anon, authenticated;

alter table public.competitions enable row level security;
create policy competitions_select_public on public.competitions for select using (active = true);
grant select on public.competitions to anon, authenticated;

alter table public.fixtures enable row level security;
create policy fixtures_select_public on public.fixtures for select using (true);
grant select on public.fixtures to anon, authenticated;

alter table public.markets enable row level security;
create policy markets_select_public on public.markets for select using (true);
grant select on public.markets to anon, authenticated;

alter table public.odds_outcomes enable row level security;
create policy odds_outcomes_select_public on public.odds_outcomes for select using (true);
grant select on public.odds_outcomes to anon, authenticated;

alter table public.bets enable row level security;
create policy bets_select_own_or_admin on public.bets for select using (user_id = auth.uid() or public.is_admin());
grant select on public.bets to authenticated;

alter table public.bet_selections enable row level security;
create policy bet_selections_select_own_or_admin on public.bet_selections
  for select using (
    exists (select 1 from public.bets b where b.id = bet_id and (b.user_id = auth.uid() or public.is_admin()))
  );
grant select on public.bet_selections to authenticated;

alter table public.booked_bets enable row level security;
create policy booked_bets_select_own_or_admin on public.booked_bets
  for select using (user_id = auth.uid() or public.is_admin());
grant select on public.booked_bets to authenticated;

alter table public.audit_logs enable row level security;
create policy audit_logs_select_admin on public.audit_logs for select using (public.is_admin());
grant select on public.audit_logs to authenticated;
