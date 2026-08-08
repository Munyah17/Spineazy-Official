"use client";

import { useEffect, useState } from "react";
import { Check, X, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { useMockStore } from "@/lib/mock/store";
import { formatMoney } from "@/lib/format";

type PendingWithdrawal = {
  id: string;
  full_name: string;
  amount: number;
  method: string;
  destination: { phone?: string } | null;
  requested_at: string;
};

export function WithdrawalsClient() {
  const supabase = createClient();
  // MOCK: remove this + the USE_MOCK_DATA branches below once real RPC calls are live.
  const mockPending = useMockStore((s) => s.pendingWithdrawals);
  const mockApprove = useMockStore((s) => s.approveWithdrawal);
  const mockReject = useMockStore((s) => s.rejectWithdrawal);
  const [pending, setPending] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      (async () => {
        await Promise.resolve();
        setPending(mockPending);
        setLoading(false);
      })();
      return;
    }

    (async () => {
      const { data } = await supabase.rpc("fn_get_pending_withdrawals", { p_limit: 50 });
      setPending((data as unknown as PendingWithdrawal[]) ?? []);
      setLoading(false);
    })();
  }, [supabase, mockPending]);

  async function approve(id: string) {
    setBusyId(id);
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      mockApprove(id);
      setBusyId(null);
      toast.success("Withdrawal approved");
      return;
    }

    const { error } = await supabase.rpc("fn_approve_withdrawal", { p_withdrawal_id: id });
    setBusyId(null);
    if (error) {
      toast.error("Couldn't approve withdrawal", { description: error.message });
      return;
    }
    toast.success("Withdrawal approved");
    setPending((p) => p.filter((w) => w.id !== id));
  }

  async function reject(id: string) {
    setBusyId(id);
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      mockReject(id);
      setBusyId(null);
      toast.success("Withdrawal rejected");
      return;
    }

    const { error } = await supabase.rpc("fn_reject_withdrawal", { p_withdrawal_id: id, p_reason: "Rejected by admin" });
    setBusyId(null);
    if (error) {
      toast.error("Couldn't reject withdrawal", { description: error.message });
      return;
    }
    toast.success("Withdrawal rejected");
    setPending((p) => p.filter((w) => w.id !== id));
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
      <p className="text-sm text-muted-foreground">Review and action every withdrawal request waiting on approval.</p>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : pending.length > 0 ? (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {pending.map((w) => (
              <div key={w.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{w.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {w.method} • {w.destination?.phone ?? ""} •{" "}
                    {new Date(w.requested_at).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="font-mono text-sm font-semibold text-foreground">{formatMoney(w.amount)}</span>
                  <Button size="icon-sm" variant="ghost" disabled={busyId === w.id} onClick={() => approve(w.id)} className="text-win hover:text-win">
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" disabled={busyId === w.id} onClick={() => reject(w.id)} className="text-destructive hover:text-destructive">
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          <ArrowUpFromLine className="size-4 shrink-0" />
          No withdrawals waiting for review.
        </p>
      )}
    </div>
  );
}
