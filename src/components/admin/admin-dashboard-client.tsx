"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserCheck, ArrowDownToLine, ArrowUpFromLine, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const ACTIVITY_LABEL: Record<string, string> = {
  new_user: "New User Registered",
  deposit: "Deposit",
  withdrawal: "Withdrawal Requested",
};

export function AdminDashboardClient() {
  const supabase = createClient();
  // MOCK: remove this + the USE_MOCK_DATA branch below once real RPC calls are live.
  const mockPendingCount = useMockStore((s) => s.pendingWithdrawals.length);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      (async () => {
        await Promise.resolve();
        setStats({ ...MOCK_ADMIN_STATS, pending_withdrawals: mockPendingCount });
        setActivity(MOCK_ADMIN_ACTIVITY);
      })();
      return;
    }

    (async () => {
      const [{ data: statsData }, { data: activityData }] = await Promise.all([
        supabase.rpc("fn_get_admin_stats"),
        supabase.rpc("fn_get_admin_activity", { p_limit: 8 }),
      ]);
      if (statsData) setStats(statsData as unknown as AdminStats);
      if (activityData) setActivity(activityData as Activity[]);
    })();
  }, [supabase, mockPendingCount]);

  return (
    <div className="flex flex-col gap-6 px-4 py-5 lg:px-6 lg:py-6">
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

      {stats && stats.pending_withdrawals > 0 && (
        <Link href="/admin/withdrawals">
          <Card className="border-boost/30 bg-boost/5 transition-colors hover:bg-boost/10">
            <CardContent className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-boost/15 text-boost">
                <ArrowUpFromLine className="size-4" />
              </span>
              <p className="flex-1 text-sm font-semibold text-foreground">
                {stats.pending_withdrawals} withdrawal{stats.pending_withdrawals === 1 ? "" : "s"} waiting for review
              </p>
              <Badge>{stats.pending_withdrawals}</Badge>
              <ChevronRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">Recent Activity</h2>
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
