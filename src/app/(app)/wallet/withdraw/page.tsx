"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
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
  const [balance, setBalance] = useState<number | null>(null);
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("ecocash");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
      setBalance(data?.balance ?? 0);
    })();
  }, [supabase]);

  const willReceive = useMemo(() => Number(amount) || 0, [amount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!numAmount || numAmount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${formatMoney(MIN_WITHDRAWAL)}`);
      return;
    }
    if (balance !== null && numAmount > balance) {
      toast.error("Amount exceeds your available balance");
      return;
    }
    if (!phone) {
      toast.error("Enter the destination phone number");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("fn_request_withdrawal", {
      p_amount: numAmount,
      p_method: method,
      p_destination: { phone: `+263${phone.replace(/^0+/, "")}` },
    });
    setLoading(false);

    if (error) {
      toast.error("Withdrawal request failed", { description: error.message });
      return;
    }

    toast.success("Withdrawal requested", { description: "We'll process this within 1-2 hours." });
    void data;
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
        <p className="text-sm text-muted-foreground">Available Balance</p>
        <p className="mt-1 text-2xl font-extrabold text-foreground">
          {balance === null ? "…" : formatMoney(balance)}
        </p>
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
        <p className="text-center text-xs text-muted-foreground">Withdrawals are processed within 1-2 hours.</p>
      </form>
    </div>
  );
}
