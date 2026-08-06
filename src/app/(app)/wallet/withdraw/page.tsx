"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { useMockStore } from "@/lib/mock/store";
import { formatMoney } from "@/lib/format";

const METHODS = [
  { value: "ecocash", label: "EcoCash" },
  { value: "onemoney", label: "OneMoney" },
  { value: "innbucks", label: "InnBucks" },
  { value: "bank_transfer", label: "Bank Transfer" },
] as const;

const MIN_WITHDRAWAL = 5;

export default function WithdrawPage() {
  const supabase = createClient();
  const router = useRouter();
  const { wallet: sessionWallet } = useSession();
  // MOCK: remove this + the USE_MOCK_DATA branches below once real RPC calls are live.
  const mockGuardWithdrawal = useMockStore((s) => s.guardWithdrawal);
  const mockRequestWithdrawal = useMockStore((s) => s.requestWithdrawal);
  const [profitBalance, setProfitBalance] = useState<number | null>(null);
  const [depositedBalance, setDepositedBalance] = useState<number | null>(null);
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("ecocash");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      (async () => {
        await Promise.resolve();
        setProfitBalance(sessionWallet?.profit_balance ?? 0);
        setDepositedBalance(sessionWallet?.deposited_balance ?? 0);
      })();
      return;
    }

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("wallets")
        .select("profit_balance, deposited_balance")
        .eq("user_id", user.id)
        .single();
      setProfitBalance(data?.profit_balance ?? 0);
      setDepositedBalance(data?.deposited_balance ?? 0);
    })();
  }, [supabase, sessionWallet]);

  const willReceive = useMemo(() => Number(amount) || 0, [amount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!numAmount || numAmount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${formatMoney(MIN_WITHDRAWAL)}`);
      return;
    }
    if (!phone) {
      toast.error("Enter the destination phone number");
      return;
    }

    setLoading(true);

    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (!mockGuardWithdrawal(numAmount)) {
        setLoading(false);
        setBlockedOpen(true);
        return;
      }
      mockRequestWithdrawal(numAmount, method, `+263${phone.replace(/^0+/, "")}`);
      setLoading(false);
      toast.success("Withdrawal requested", { description: "We'll process this within 48 hours." });
      router.push("/wallet");
      return;
    }

    const { data: allowed, error: guardError } = await supabase.rpc("fn_guard_withdrawal_request", {
      p_amount: numAmount,
    });

    if (guardError) {
      setLoading(false);
      toast.error("Couldn't verify your balance", { description: guardError.message });
      return;
    }

    if (!allowed) {
      setLoading(false);
      setBlockedOpen(true);
      return;
    }

    const { error } = await supabase.rpc("fn_request_withdrawal", {
      p_amount: numAmount,
      p_method: method,
      p_destination: { phone: `+263${phone.replace(/^0+/, "")}` },
    });
    setLoading(false);

    if (error) {
      toast.error("Withdrawal request failed", { description: error.message });
      return;
    }

    toast.success("Withdrawal requested", { description: "We'll process this within 48 hours." });
    router.push("/wallet");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-3 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Withdraw</h1>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">Available to Withdraw</p>
        <p className="mt-1 text-2xl font-extrabold text-foreground">
          {profitBalance === null ? "…" : formatMoney(profitBalance)}
        </p>
        {depositedBalance !== null && depositedBalance > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            + {formatMoney(depositedBalance)} deposited balance — bet-only, not withdrawable
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label>Withdrawal Method</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <span className="flex items-center rounded-md border border-input bg-secondary px-3 text-sm font-medium text-muted-foreground">
              +263
            </span>
            <Input
              id="phone"
              type="tel"
              placeholder="712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="amount"
              type="number"
              min={MIN_WITHDRAWAL}
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-6"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">Min. {formatMoney(MIN_WITHDRAWAL)}</p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3 text-sm">
          <span className="text-muted-foreground">You will receive</span>
          <span className="font-semibold text-foreground">{formatMoney(willReceive)}</span>
        </div>

        <Button type="submit" disabled={loading} className="w-full glow-primary">
          {loading ? "Submitting…" : "Submit Withdrawal"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Withdrawals are processed within 48 hours.</p>
      </form>

      <Dialog open={blockedOpen} onOpenChange={setBlockedOpen}>
        <DialogContent>
          <DialogHeader>
            <span className="flex size-11 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <ShieldAlert className="size-5" />
            </span>
            <DialogTitle className="mt-2">Deposited funds can&apos;t be withdrawn</DialogTitle>
            <DialogDescription>
              That amount includes money from a deposit, which can only be used to place bets — it can&apos;t be
              withdrawn or shared as a Red Packet. Want to send a loved one bet-only funds instead? You can buy them
              a voucher.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockedOpen(false)} className="w-full sm:w-auto">
              Got it
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/chat">Send a Voucher</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
