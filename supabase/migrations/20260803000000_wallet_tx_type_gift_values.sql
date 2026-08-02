-- New wallet_transactions.type values for the Chat & Pay feature. Split into
-- its own migration/transaction because Postgres won't let a newly-added
-- enum value be used (in an INSERT, etc.) within the same transaction it was
-- added in -- referencing it only inside a function body (not executed at
-- CREATE time) would be fine, but keeping this separate avoids relying on
-- that subtlety.
alter type public.wallet_tx_type add value if not exists 'gift_sent';
alter type public.wallet_tx_type add value if not exists 'gift_received';
alter type public.wallet_tx_type add value if not exists 'voucher_issued';
alter type public.wallet_tx_type add value if not exists 'voucher_redeemed';
