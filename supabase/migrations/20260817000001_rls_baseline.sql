-- Spineazy: RLS baseline for core identity/money tables. These tables were
-- created directly on the live Supabase project in earlier work and their
-- RLS policies were never committed to this repo -- this migration codifies
-- a conservative baseline matching how the app code actually reads/writes
-- each table (verified against src/ before writing this).
--
-- IMPORTANT: review this against the live project's current policies
-- (Supabase dashboard -> Database -> Policies) before applying, in case
-- something was deliberately configured differently there. `drop policy if
-- exists` + `create policy` makes this safe to re-run, but it will replace
-- any existing policy with the same name.

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;

-- profiles -----------------------------------------------------------------
-- full_name/id must be readable across users for chat search & thread
-- display (fn_search_users, chat_threads UI), so SELECT is intentionally
-- broad. WRITE is restricted to the owner, and further restricted to
-- non-privileged columns via column-level grants so a crafted update can't
-- self-promote role/status.
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select to authenticated
  using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from authenticated;
grant update (full_name, country, date_of_birth, avatar_url) on public.profiles to authenticated;

-- wallets --------------------------------------------------------------------
-- Balance fields are read-only to the client; every write happens through a
-- SECURITY DEFINER RPC (fn_wallet_debit/credit, fn_send_red_packet, etc.) or
-- the service-role key, both of which bypass RLS.
drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own on public.wallets
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- wallet_transactions --------------------------------------------------------
-- Ledger is read-only to the client; rows are only ever inserted by RPCs.
drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
create policy wallet_transactions_select_own on public.wallet_transactions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- deposits ---------------------------------------------------------------
-- The EcoCash/Paynow deposit routes insert a `processing` row client-side
-- (request-scoped user client) before charging, so INSERT must be allowed.
-- Status transitions afterwards happen via the service-role key.
drop policy if exists deposits_select_own on public.deposits;
create policy deposits_select_own on public.deposits
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists deposits_insert_own on public.deposits;
create policy deposits_insert_own on public.deposits
  for insert to authenticated
  with check (user_id = auth.uid());

-- withdrawals ------------------------------------------------------------
-- Created only via fn_request_withdrawal (SECURITY DEFINER) -- no client
-- insert policy needed. Read-only to the owner and admins.
drop policy if exists withdrawals_select_own on public.withdrawals;
create policy withdrawals_select_own on public.withdrawals
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
