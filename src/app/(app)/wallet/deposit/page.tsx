"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone, Landmark, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "ecocash", label: "EcoCash", icon: Smartphone },
  { value: "onemoney", label: "OneMoney", icon: Smartphone },
  { value: "innbucks", label: "InnBucks", icon: Smartphone },
  { value: "bank_transfer", label: "Bank Transfer", icon: Landmark },
  { value: "visa", label: "Visa / Mastercard", icon: CreditCard },
] as const;

const PRESETS = [10, 20, 50, 100, 200];

export default function DepositPage() {
  const router = useRouter();
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("ecocash");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      if (method === "ecocash") {
        const res = await fetch("/api/deposits/ecocash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: numAmount, phone }),
        });
        const data = await res.json();
        if (res.ok && data.status === "completed") {
          toast.success("Deposit received!");
          router.push("/wallet");
          router.refresh();
        } else if (res.status === 202 && data.status === "pending") {
          router.push(`/wallet/deposit/result?depositId=${data.depositId}&provider=ecocash`);
        } else {
          toast.error("Deposit failed", { description: data.message ?? data.error });
        }
      } else {
        const res = await fetch("/api/deposits/paynow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: numAmount, method }),
        });
        const data = await res.json();
        if (res.ok && data.browserUrl) {
          window.location.href = data.browserUrl;
        } else {
          toast.error("Could not start deposit", { description: data.error });
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-3 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center gap-3">
        <Link href="/wallet" className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Deposit</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <Label className="mb-2 block">Select Payment Method</Label>
          <RadioGroup value={method} onValueChange={(v) => setMethod(v as typeof method)}>
            {METHODS.map((m) => (
              <Card
                key={m.value}
                size="sm"
                className={cn(
                  "cursor-pointer flex-row items-center gap-3 px-4 transition-colors",
                  method === m.value && "ring-2 ring-primary"
                )}
                onClick={() => setMethod(m.value)}
              >
                <m.icon className="size-4.5 text-primary" />
                <span className="flex-1 text-sm font-medium text-foreground">{m.label}</span>
                <RadioGroupItem value={m.value} />
              </Card>
            ))}
          </RadioGroup>
        </div>

        {method === "ecocash" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">EcoCash Number</Label>
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
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="amount"
              type="number"
              min={1}
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-6"
              required
            />
          </div>
          <div className="mt-1 flex gap-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setAmount(String(p))}
                className={cn(
                  "flex-1 rounded-lg border border-border py-1.5 text-sm font-medium transition-colors hover:bg-accent",
                  amount === String(p) && "border-primary bg-primary/10 text-primary"
                )}
              >
                ${p}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full glow-primary">
          {loading ? "Processing…" : "Deposit Now"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {method === "ecocash"
            ? "Your deposit will be credited instantly."
            : "You'll be taken to Paynow to complete payment securely, then we'll confirm and credit your wallet automatically."}
        </p>
      </form>
    </div>
  );
}
