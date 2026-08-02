-- Spineazy: dual-balance fund tracking + minimal Chat & Pay (red packets,
-- vouchers) + the withdrawal guard that keeps deposited funds locked to
-- betting only.
--
-- CORE RULE (confirmed with product owner 2026-08-03):
--   - deposited_balance: money that came from a real-money deposit, or from
--     a redeemed voucher. Can be wagered, never withdrawn, never gifted.
--   - profit_balance: winnings, cashouts, and received gifts. Freely
--     withdrawable and giftable.
--   - Placing a bet spends deposited_balance first, then profit_balance.
--   - Any win/cashout/refund always lands in profit_balance (a refund
--     mirrors the stake priority and returns to deposited_balance first --
--     it's undoing a stake, not creating profit).
--
-- WHY A TRIGGER INSTEAD OF EDITING fn_place_bet / fn_wallet_debit / etc:
-- those functions' bodies aren't available in this repo (created directly
-- on the hosted project before migrations were tracked here), so editing
-- them blind risks silently breaking live betting/deposit flows. Every one
-- of them already writes to wallet_transactions before/while touching
-- wallets.balance, so a trigger on that table derives the real delta from
-- balance_after - balance_before and applies the split there -- no existing
-- function needs to change.

alter table public.wallets
  add column deposited_balance numeric(14,2) not null default 0,
  add column profit_balance numeric(14,2) not null default 0;

-- Backfill: existing balances are treated as fully withdrawable. We have no
-- way to know the true deposit/profit provenance of money that moved before
-- this migration, and defaulting to "withdrawable" preserves today's
-- behavior for existing users instead of retroactively freezing funds they
-- could already cash out.
update public.wallets set profit_balance = balance, deposited_balance = 0;

create or replace function public.fn_apply_wallet_fund_split()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta numeric := NEW.balance_after - NEW.balance_before;
  v_deposit numeric;
  v_take_deposit numeric;
  v_take_profit numeric;
begin
  if v_delta = 0 then
    return NEW;
  end if;

  if NEW.type = 'deposit' then
    update public.wallets set deposited_balance = deposited_balance + v_delta where id = NEW.wallet_id;

  elsif NEW.type = 'voucher_redeemed' then
    -- bet-only funds, same as a deposit.
    if v_delta > 0 then
      update public.wallets set deposited_balance = deposited_balance + v_delta where id = NEW.wallet_id;
    end if;

  elsif NEW.type in ('bet_payout', 'cashout', 'gift_received') then
    if v_delta > 0 then
      update public.wallets set profit_balance = profit_balance + v_delta where id = NEW.wallet_id;
    end if;

  elsif NEW.type = 'gift_sent' then
    -- red packets are profit-only by rule; fn_send_red_packet already
    -- verified sufficient profit_balance before this row was written.
    if v_delta < 0 then
      update public.wallets set profit_balance = profit_balance + v_delta where id = NEW.wallet_id;
    end if;

  elsif NEW.type = 'voucher_issued' then
    -- vouchers convert deposited funds only; fn_issue_voucher already
    -- verified sufficient deposited_balance before this row was written.
    if v_delta < 0 then
      update public.wallets set deposited_balance = deposited_balance + v_delta where id = NEW.wallet_id;
    end if;

  elsif NEW.type = 'withdrawal' then
    -- fn_guard_withdrawal_request already verified sufficient
    -- profit_balance before the withdrawal request could be created.
    if v_delta < 0 then
      update public.wallets set profit_balance = profit_balance + v_delta where id = NEW.wallet_id;
    end if;

  elsif NEW.type in ('bet_stake', 'bet_refund') then
    select deposited_balance into v_deposit from public.wallets where id = NEW.wallet_id;

    if v_delta < 0 then
      v_take_deposit := least(abs(v_delta), greatest(v_deposit, 0));
      v_take_profit := abs(v_delta) - v_take_deposit;
      update public.wallets
        set deposited_balance = deposited_balance - v_take_deposit,
            profit_balance = profit_balance - v_take_profit
        where id = NEW.wallet_id;
    else
      -- refund: mirror the stake priority, return to deposited_balance first.
      update public.wallets set deposited_balance = deposited_balance + v_delta where id = NEW.wallet_id;
    end if;

  else
    -- bonus_credit / bonus_debit / adjustment / booking_release: bonus
    -- funds already track separately via wallets.bonus_balance; manual
    -- adjustments are left out of the split for admin judgement.
    null;
  end if;

  return NEW;
end;
$$;

create trigger trg_wallet_transactions_fund_split
  after insert on public.wallet_transactions
  for each row
  execute function public.fn_apply_wallet_fund_split();

-- Fund protection log -----------------------------------------------------

create table public.fund_protection_violations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'withdrawal' check (kind in ('withdrawal', 'red_packet')),
  attempted_amount numeric(14,2) not null,
  available_profit_balance numeric(14,2) not null,
  deposited_balance_at_attempt numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create index fund_protection_violations_user_idx on public.fund_protection_violations (user_id);
alter table public.fund_protection_violations enable row level security;

create policy "fund_protection_violations_select_admin" on public.fund_protection_violations
  for select using (public.is_admin());

grant select on public.fund_protection_violations to authenticated;

-- Called by the withdraw page BEFORE fn_request_withdrawal. Returns false
-- (and logs the attempt) if the amount would dip into deposited_balance.
create or replace function public.fn_guard_withdrawal_request(p_amount numeric)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet record;
begin
  select deposited_balance, profit_balance into v_wallet
  from public.wallets where user_id = auth.uid() for update;

  if v_wallet is null then
    raise exception 'Wallet not found';
  end if;

  if p_amount > v_wallet.profit_balance then
    insert into public.fund_protection_violations
      (user_id, kind, attempted_amount, available_profit_balance, deposited_balance_at_attempt)
    values (auth.uid(), 'withdrawal', p_amount, v_wallet.profit_balance, v_wallet.deposited_balance);
    return false;
  end if;

  return true;
end;
$$;

grant execute on function public.fn_guard_withdrawal_request(numeric) to authenticated;

create or replace function public.fn_get_admin_fund_violations(p_limit int default 30)
returns table (
  id uuid,
  user_id uuid,
  full_name text,
  kind text,
  attempted_amount numeric,
  available_profit_balance numeric,
  deposited_balance_at_attempt numeric,
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
  select v.id, v.user_id, p.full_name, v.kind, v.attempted_amount, v.available_profit_balance,
         v.deposited_balance_at_attempt, v.created_at
  from public.fund_protection_violations v
  join public.profiles p on p.id = v.user_id
  order by v.created_at desc
  limit p_limit;
end;
$$;

grant execute on function public.fn_get_admin_fund_violations(int) to authenticated;

-- Minimal 1:1 Chat & Pay ----------------------------------------------------

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user_a_id < user_b_id),
  unique (user_a_id, user_b_id)
);

create index chat_threads_user_a_idx on public.chat_threads (user_a_id);
create index chat_threads_user_b_idx on public.chat_threads (user_b_id);

create table public.red_packets (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  issuer_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  thread_id uuid references public.chat_threads(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'issued' check (status in ('issued', 'redeemed', 'void')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'red_packet', 'voucher')),
  body text,
  red_packet_id uuid references public.red_packets(id) on delete set null,
  voucher_id uuid references public.vouchers(id) on delete set null,
  created_at timestamptz not null default now()
);

create index chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.red_packets enable row level security;
alter table public.vouchers enable row level security;

create policy "chat_threads_select_participant" on public.chat_threads
  for select using (user_a_id = auth.uid() or user_b_id = auth.uid());

create policy "chat_messages_select_participant" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_threads t
      where t.id = thread_id and (t.user_a_id = auth.uid() or t.user_b_id = auth.uid())
    )
  );

create policy "red_packets_select_participant" on public.red_packets
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "vouchers_select_participant" on public.vouchers
  for select using (issuer_id = auth.uid() or recipient_id = auth.uid());

grant select on public.chat_threads to authenticated;
grant select on public.chat_messages to authenticated;
grant select on public.red_packets to authenticated;
grant select on public.vouchers to authenticated;

create or replace function public.fn_get_or_create_thread(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread_id uuid;
  v_a uuid := least(auth.uid(), p_other_user_id);
  v_b uuid := greatest(auth.uid(), p_other_user_id);
begin
  if p_other_user_id = auth.uid() then
    raise exception 'Cannot start a chat with yourself';
  end if;
  if p_other_user_id is null then
    raise exception 'Unknown recipient';
  end if;

  select id into v_thread_id from public.chat_threads where user_a_id = v_a and user_b_id = v_b;
  if v_thread_id is null then
    insert into public.chat_threads (user_a_id, user_b_id) values (v_a, v_b) returning id into v_thread_id;
  end if;

  return v_thread_id;
end;
$$;

grant execute on function public.fn_get_or_create_thread(uuid) to authenticated;

create or replace function public.fn_send_chat_message(p_thread_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message_id uuid;
  v_ok boolean;
begin
  select true into v_ok from public.chat_threads
    where id = p_thread_id and (user_a_id = auth.uid() or user_b_id = auth.uid());
  if v_ok is null then
    raise exception 'Not authorized';
  end if;
  if length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'Message cannot be empty';
  end if;

  insert into public.chat_messages (thread_id, sender_id, kind, body)
  values (p_thread_id, auth.uid(), 'text', p_body)
  returning id into v_message_id;

  update public.chat_threads set last_message_at = now() where id = p_thread_id;

  return v_message_id;
end;
$$;

grant execute on function public.fn_send_chat_message(uuid, text) to authenticated;

create or replace function public.fn_send_red_packet(p_recipient_id uuid, p_amount numeric, p_thread_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_wallet record;
  v_packet_id uuid;
  v_message_id uuid;
  v_thread_ok boolean;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;
  if p_recipient_id = auth.uid() then
    raise exception 'Cannot send a red packet to yourself';
  end if;

  select true into v_thread_ok from public.chat_threads
    where id = p_thread_id and (user_a_id = auth.uid() or user_b_id = auth.uid());
  if v_thread_ok is null then
    raise exception 'Not authorized';
  end if;

  select deposited_balance, profit_balance into v_sender_wallet
  from public.wallets where user_id = auth.uid() for update;
  if v_sender_wallet is null then
    raise exception 'Wallet not found';
  end if;

  if p_amount > v_sender_wallet.profit_balance then
    insert into public.fund_protection_violations
      (user_id, kind, attempted_amount, available_profit_balance, deposited_balance_at_attempt)
    values (auth.uid(), 'red_packet', p_amount, v_sender_wallet.profit_balance, v_sender_wallet.deposited_balance);
    raise exception 'insufficient_profit_balance';
  end if;

  perform public.fn_wallet_debit(
    p_amount := p_amount,
    p_type := 'gift_sent',
    p_user_id := auth.uid(),
    p_reference_id := p_thread_id::text,
    p_reference_type := 'red_packet',
    p_description := 'Red packet sent'
  );

  perform public.fn_wallet_credit(
    p_amount := p_amount,
    p_type := 'gift_received',
    p_user_id := p_recipient_id,
    p_reference_id := p_thread_id::text,
    p_reference_type := 'red_packet',
    p_description := 'Red packet received'
  );

  insert into public.red_packets (thread_id, sender_id, recipient_id, amount)
  values (p_thread_id, auth.uid(), p_recipient_id, p_amount)
  returning id into v_packet_id;

  insert into public.chat_messages (thread_id, sender_id, kind, red_packet_id)
  values (p_thread_id, auth.uid(), 'red_packet', v_packet_id)
  returning id into v_message_id;

  update public.chat_threads set last_message_at = now() where id = p_thread_id;

  return json_build_object('packet_id', v_packet_id, 'message_id', v_message_id);
end;
$$;

grant execute on function public.fn_send_red_packet(uuid, numeric, uuid) to authenticated;

create or replace function public.fn_issue_voucher(p_recipient_id uuid, p_amount numeric, p_thread_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_wallet record;
  v_code text;
  v_voucher_id uuid;
  v_message_id uuid;
  v_thread_ok boolean;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;
  if p_recipient_id = auth.uid() then
    raise exception 'Cannot send a voucher to yourself';
  end if;

  select true into v_thread_ok from public.chat_threads
    where id = p_thread_id and (user_a_id = auth.uid() or user_b_id = auth.uid());
  if v_thread_ok is null then
    raise exception 'Not authorized';
  end if;

  select deposited_balance into v_sender_wallet
  from public.wallets where user_id = auth.uid() for update;
  if v_sender_wallet is null then
    raise exception 'Wallet not found';
  end if;
  if p_amount > v_sender_wallet.deposited_balance then
    raise exception 'insufficient_deposited_balance';
  end if;

  perform public.fn_wallet_debit(
    p_amount := p_amount,
    p_type := 'voucher_issued',
    p_user_id := auth.uid(),
    p_reference_id := p_thread_id::text,
    p_reference_type := 'voucher',
    p_description := 'Voucher issued'
  );

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.vouchers (code, issuer_id, recipient_id, amount, thread_id)
  values (v_code, auth.uid(), p_recipient_id, p_amount, p_thread_id)
  returning id into v_voucher_id;

  insert into public.chat_messages (thread_id, sender_id, kind, voucher_id)
  values (p_thread_id, auth.uid(), 'voucher', v_voucher_id)
  returning id into v_message_id;

  update public.chat_threads set last_message_at = now() where id = p_thread_id;

  return json_build_object('voucher_id', v_voucher_id, 'code', v_code, 'message_id', v_message_id);
end;
$$;

grant execute on function public.fn_issue_voucher(uuid, numeric, uuid) to authenticated;

create or replace function public.fn_redeem_voucher(p_voucher_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voucher record;
begin
  select * into v_voucher from public.vouchers where id = p_voucher_id for update;
  if v_voucher is null then
    raise exception 'Voucher not found';
  end if;
  if v_voucher.recipient_id != auth.uid() then
    raise exception 'Not authorized';
  end if;
  if v_voucher.status != 'issued' then
    raise exception 'Voucher already %', v_voucher.status;
  end if;

  perform public.fn_wallet_credit(
    p_amount := v_voucher.amount,
    p_type := 'voucher_redeemed',
    p_user_id := auth.uid(),
    p_reference_id := v_voucher.id::text,
    p_reference_type := 'voucher',
    p_description := 'Voucher redeemed'
  );

  update public.vouchers set status = 'redeemed', redeemed_at = now() where id = p_voucher_id;

  return json_build_object('amount', v_voucher.amount);
end;
$$;

grant execute on function public.fn_redeem_voucher(uuid) to authenticated;
