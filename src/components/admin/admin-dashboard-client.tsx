"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, ArrowDownToLine, ArrowUpFromLine, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/client";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { MOCK_ADMIN_STATS, MOCK_ADMIN_ACTIVITY } from "@/lib/mock/data";
import { useMockStore } from "@/lib/mock/store";
import { formatMoney } from "@/lib/format";

type AdminStats = {
  total_users: number;
  active_users: number;
  total_deposits: number;
  total_withdrawals: number;
  pending_withdrawals: number;
};

type Activity = { kind: string; label: string; amount: number | null; created_at: string };
type PendingWithdrawal = {
  id: string;
  full_name: string;
  amount: number;
  method: string;
  destination: { phone?: string } | null;
  requested_at: string;
};

const ACTIVITY_LABEL: Record<string, string> = {
  new_user: "New User Registered",
  deposit: "Deposit",
  withdrawal: "Withdrawal Requested",
};

export function AdminDashboardClient() {
  const supabase = createClient();
  // MOCK: remove this + the USE_MOCK_DATA branches below once real RPC calls are live.
  const mockPending = useMockStore((s) => s.pendingWithdrawals);
  const mockApprove = useMockStore((s) => s.approveWithdrawal);
  const mockReject = useMockStore((s) => s.rejectWithdrawal);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [pending, setPending] = useState<PendingWithdrawal[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      (async () => {
        await Promise.resolve();
        setStats({ ...MOCK_ADMIN_STATS, pending_withdrawals: mockPending.length });
        setActivity(MOCK_ADMIN_ACTIVITY);
        setPending(mockPending);
      })();
      return;
    }

    (async () => {
      const [{ data: statsData }, { data: activityData }, { data: pendingData }] = await Promise.all([
        supabase.rpc("fn_get_admin_stats"),
        supabase.rpc("fn_get_admin_activity", { p_limit: 8 }),
        supabase.rpc("fn_get_pending_withdrawals", { p_limit: 10 }),
      ]);
      if (statsData) setStats(statsData as unknown as AdminStats);
      if (activityData) setActivity(activityData as Activity[]);
      if (pendingData) setPending(pendingData as unknown as PendingWithdrawal[]);
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
    <div className="flex flex-col gap-6 px-3 py-4 lg:px-6 lg:py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
        <Badge variant="secondary">This Month</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats ? String(stats.total_users) : "…"} />
        <StatCard icon={UserCheck} label="Active Users" value={stats ? String(stats.active_users) : "…"} tone="win" />
        <StatCard
          icon={ArrowDownToLine}
          label="Total Deposits"
          value={stats ? formatMoney(stats.total_deposits) : "…"}
          tone="win"
        />
        <StatCard
          icon={ArrowUpFromLine}
          label="Total Withdrawals"
          value={stats ? formatMoney(stats.total_withdrawals) : "…"}
          tone="destructive"
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          Pending Withdrawals
          {stats && stats.pending_withdrawals > 0 && (
            <Badge className="ml-2 align-middle">{stats.pending_withdrawals}</Badge>
          )}
        </h2>
        {pending.length > 0 ? (
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
                    <span className="text-sm font-semibold text-foreground">{formatMoney(w.amount)}</span>
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
          <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
            No withdrawals waiting for review.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Quick Activities</h2>
        {activity.length > 0 ? (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{ACTIVITY_LABEL[a.kind] ?? a.kind}</p>
                    <p className="text-xs text-muted-foreground">{a.label}</p>
                  </div>
                  <div className="text-right">
                    {a.amount != null && <p className="text-sm font-semibold text-foreground">{formatMoney(a.amount)}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">No recent activity.</p>
        )}
      </section>
    </div>
  );
}
