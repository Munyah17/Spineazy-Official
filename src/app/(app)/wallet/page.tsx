import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Wallet as WalletIcon, Gift, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { SectionHeader } from "@/components/section-header";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

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
};

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/wallet");

  const [{ data: wallet }, { data: deposits }, { data: withdrawals }, { data: transactions }] = await Promise.all([
    supabase.from("wallets").select("*").eq("user_id", user.id).single(),
    supabase.from("deposits").select("amount").eq("user_id", user.id).eq("status", "completed"),
    supabase.from("withdrawals").select("amount").eq("user_id", user.id).eq("status", "completed"),
    supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalDeposits = (deposits ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  const totalWithdrawals = (withdrawals ?? []).reduce((sum, w) => sum + Number(w.amount), 0);

  return (
    <div className="flex flex-col gap-6 px-3 py-4 lg:px-6 lg:py-6">
      <Card className="glow-primary bg-gradient-to-br from-primary/20 via-card to-card">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
            <p className="mt-1 text-3xl font-extrabold text-foreground">{formatMoney(wallet?.balance ?? 0)}</p>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={ArrowDownToLine} label="Total Deposits" value={formatMoney(totalDeposits)} tone="win" />
        <StatCard icon={TrendingDown} label="Total Withdrawals" value={formatMoney(totalWithdrawals)} tone="destructive" />
        <StatCard icon={Gift} label="Bonus Balance" value={formatMoney(wallet?.bonus_balance ?? 0)} tone="boost" />
      </div>

      <section>
        <SectionHeader title="Recent Transactions" href="/my-bets" action="View All" />
        {transactions && transactions.length > 0 ? (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {transactions.map((tx) => {
                const isCredit = ["deposit", "bet_payout", "bet_refund", "bonus_credit", "cashout"].includes(tx.type);
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
