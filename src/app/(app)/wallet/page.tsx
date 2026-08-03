"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Wallet as WalletIcon, Gift, TrendingDown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { SectionHeader } from "@/components/section-header";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { useMockStore } from "@/lib/mock/store";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type WalletTransaction = Database["public"]["Tables"]["wallet_transactions"]["Row"];

const TX_LABEL: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  bet_stake: "Bet Stake",
  bet_payout: "Bet Winnings",
  bet_refund: "Bet Refund",
  bonus_credit: "Bonus Credit",
  bonus_debit: "Bonus Debit",
  cashout: "Cash Out",
  adjustment: "Adjustment",
  booking_release: "Booking Release",
  gift_sent: "Red Packet Sent",
  gift_received: "Red Packet Received",
  voucher_issued: "Voucher Sent",
  voucher_redeemed: "Voucher Redeemed",
};

const CREDIT_TYPES = ["deposit", "bet_payout", "bet_refund", "bonus_credit", "cashout", "gift_received", "voucher_redeemed"];

export default function WalletPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, wallet } = useSession();
  // MOCK: remove this + the USE_MOCK_DATA branches below once real queries are live.
  const mockTransactions = useMockStore((s) => s.transactions);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      (async () => {
        await Promise.resolve();
        setTransactions(mockTransactions.slice(0, 8));
        setTotalDeposits(
          mockTransactions.filter((t) => t.type === "deposit").reduce((sum, t) => sum + Number(t.amount), 0)
        );
        setTotalWithdrawals(
          mockTransactions.filter((t) => t.type === "withdrawal").reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
        );
      })();
      return;
    }

    if (!profile) {
      router.push("/sign-in?next=/wallet");
      return;
    }

    (async () => {
      const [{ data: deposits }, { data: withdrawals }, { data: txs }] = await Promise.all([
        supabase.from("deposits").select("amount").eq("user_id", profile.id).eq("status", "completed"),
        supabase.from("withdrawals").select("amount").eq("user_id", profile.id).eq("status", "completed"),
        supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      setTotalDeposits((deposits ?? []).reduce((sum, d) => sum + Number(d.amount), 0));
      setTotalWithdrawals((withdrawals ?? []).reduce((sum, w) => sum + Number(w.amount), 0));
      setTransactions(txs ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, mockTransactions]);

  return (
    <div className="flex flex-col gap-6 px-3 py-4 lg:px-6 lg:py-6">
      <Card className="glow-primary bg-gradient-to-br from-primary/20 via-card to-card">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
            <p className="mt-1 text-3xl font-extrabold text-foreground">{formatMoney(wallet?.balance ?? 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatMoney(wallet?.profit_balance ?? 0)} withdrawable · {formatMoney(wallet?.deposited_balance ?? 0)}{" "}
              bet-only
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/wallet/deposit">
                <ArrowDownToLine className="size-4" /> Deposit
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/wallet/withdraw">
                <ArrowUpFromLine className="size-4" /> Withdraw
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ArrowUpFromLine} label="Withdrawable" value={formatMoney(wallet?.profit_balance ?? 0)} tone="win" />
        <StatCard icon={ArrowDownToLine} label="Bet-only" value={formatMoney(wallet?.deposited_balance ?? 0)} />
        <StatCard icon={Gift} label="Bonus Balance" value={formatMoney(wallet?.bonus_balance ?? 0)} tone="boost" />
        <Link href="/chat" className="block">
          <StatCard icon={MessageCircle} label="Chat & Pay" value="Send a gift" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard icon={ArrowDownToLine} label="Total Deposits" value={formatMoney(totalDeposits)} tone="win" />
        <StatCard icon={TrendingDown} label="Total Withdrawals" value={formatMoney(totalWithdrawals)} tone="destructive" />
      </div>

      <section>
        <SectionHeader title="Recent Transactions" href="/my-bets" action="View All" />
        {transactions.length > 0 ? (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {transactions.map((tx) => {
                const isCredit = CREDIT_TYPES.includes(tx.type);
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        isCredit ? "bg-win/15 text-win" : "bg-destructive/15 text-destructive"
                      )}
                    >
                      <WalletIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {TX_LABEL[tx.type] ?? tx.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString("en-US", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={cn("text-sm font-semibold", isCredit ? "text-win" : "text-destructive")}>
                      {isCredit ? "+" : "-"}
                      {formatMoney(Math.abs(Number(tx.amount)))}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
            No transactions yet.
          </p>
        )}
      </section>
    </div>
  );
}
