"use client";

import { useEffect, useState } from "react";
import { Users, Shield, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { DepositsWithdrawalsChart, TopGamesChart } from "@/components/admin/super-admin-charts";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/format";

type SuperAdminStats = {
  total_users: number;
  total_operators: number;
  total_deposits: number;
  total_withdrawals: number;
  platform_profit: number;
};

export function SuperAdminDashboardClient() {
  const supabase = createClient();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [series, setSeries] = useState<{ day: string; deposits: number; withdrawals: number }[]>([]);
  const [topGames, setTopGames] = useState<{ title: string; turnover: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: statsData }, { data: seriesData }, { data: gamesData }] = await Promise.all([
        supabase.rpc("fn_get_super_admin_stats"),
        supabase.rpc("fn_get_deposits_vs_withdrawals", { p_days: 14 }),
        supabase.rpc("fn_get_top_games", { p_limit: 5 }),
      ]);
      if (statsData) setStats(statsData as unknown as SuperAdminStats);
      if (seriesData) setSeries(seriesData as { day: string; deposits: number; withdrawals: number }[]);
      if (gamesData) setTopGames(gamesData as { title: string; turnover: number }[]);
    })();
  }, [supabase]);

  return (
    <div className="flex flex-col gap-6 px-3 py-4 lg:px-6 lg:py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Super Admin Dashboard</h1>
        <Badge variant="secondary">This Month</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Platform Users" value={stats ? String(stats.total_users) : "…"} />
        <StatCard icon={Shield} label="Total Operators" value={stats ? String(stats.total_operators) : "…"} />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={stats ? formatMoney(stats.total_deposits) : "…"}
          tone="win"
        />
        <StatCard
          icon={TrendingUp}
          label="Platform Profit"
          value={stats ? formatMoney(stats.platform_profit) : "…"}
          tone="boost"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deposits vs Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <DepositsWithdrawalsChart data={series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Games by Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <TopGamesChart data={topGames} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
