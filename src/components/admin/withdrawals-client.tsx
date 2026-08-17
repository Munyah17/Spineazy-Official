"use client";

import { useEffect, useState } from "react";
import { Check, X, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
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
  const [pending, setPending] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("fn_get_pending_withdrawals", { p_limit: 50 });
      setPending((data as unknown as PendingWithdrawal[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  async function approve(id: string, amount: number) {
    setBusyId(id);
    const { error } = await supabase.rpc("fn_approve_withdrawal", { p_withdrawal_id: id });
    setBusyId(null);
    if (error) {
      toast.error("Couldn't approve withdrawal", { description: error.message });
      return;
    }
    await supabase.rpc("fn_log_admin_action", {
      p_action: "withdrawal_approved",
      p_target_type: "withdrawal",
      p_target_id: id,
      p_meta: { amount },
    });
    toast.success("Withdrawal approved");
    setPending((p) => p.filter((w) => w.id !== id));
  }

  async function reject(id: string, amount: number) {
    setBusyId(id);
    const { error } = await supabase.rpc("fn_reject_withdrawal", { p_withdrawal_id: id, p_reason: "Rejected by admin" });
    setBusyId(null);
    if (error) {
      toast.error("Couldn't reject withdrawal", { description: error.message });
      return;
    }
    await supabase.rpc("fn_log_admin_action", {
      p_action: "withdrawal_rejected",
      p_target_type: "withdrawal",
      p_target_id: id,
      p_meta: { amount, reason: "Rejected by admin" },
    });
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
                  <Button size="icon-sm" variant="ghost" disabled={busyId === w.id} onClick={() => approve(w.id, w.amount)} className="text-win hover:text-win">
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" disabled={busyId === w.id} onClick={() => reject(w.id, w.amount)} className="text-destructive hover:text-destructive">
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
