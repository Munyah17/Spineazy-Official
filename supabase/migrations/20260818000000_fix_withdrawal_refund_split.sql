-- Spineazy: fix the dual-balance fund-split trigger (from
-- 20260803000001_fund_split_chat_pay.sql) to handle withdrawal refunds.
--
-- fn_reject_withdrawal (new, in 00000000000000_base_schema.sql) refunds a
-- rejected withdrawal by writing a positive-delta 'withdrawal' wallet
-- transaction. The original trigger only handled the negative/debit case
-- for that type (the request-time lock) and silently did nothing for a
-- positive delta, which would have left profit_balance out of sync with
-- the real balance. This adds the missing branch.

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
    if v_delta > 0 then
      update public.wallets set deposited_balance = deposited_balance + v_delta where id = NEW.wallet_id;
    end if;

  elsif NEW.type in ('bet_payout', 'cashout', 'gift_received') then
    if v_delta > 0 then
      update public.wallets set profit_balance = profit_balance + v_delta where id = NEW.wallet_id;
    end if;

  elsif NEW.type = 'gift_sent' then
    if v_delta < 0 then
      update public.wallets set profit_balance = profit_balance + v_delta where id = NEW.wallet_id;
    end if;

  elsif NEW.type = 'voucher_issued' then
    if v_delta < 0 then
      update public.wallets set deposited_balance = deposited_balance + v_delta where id = NEW.wallet_id;
    end if;

  elsif NEW.type = 'withdrawal' then
    -- Negative delta: fn_request_withdrawal locking funds at request time
    -- (fn_guard_withdrawal_request already verified sufficient profit_balance).
    -- Positive delta: fn_reject_withdrawal refunding a rejected request.
    update public.wallets set profit_balance = profit_balance + v_delta where id = NEW.wallet_id;

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
      update public.wallets set deposited_balance = deposited_balance + v_delta where id = NEW.wallet_id;
    end if;

  else
    null;
  end if;

  return NEW;
end;
$$;
