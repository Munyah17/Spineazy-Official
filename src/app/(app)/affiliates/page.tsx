"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserCheck, DollarSign, Clock, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";
import { formatMoney } from "@/lib/format";

type AffiliateStats = {
  referral_code: string | null;
  total_referrals: number;
  active_players: number;
  total_commission: number;
  pending_commission: number;
};

type Referral = {
  id: string;
  full_name: string;
  created_at: string;
  status: string;
  commission: number;
};

export default function AffiliatesPage() {
  const { profile } = useSession();
  const supabase = createClient();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [{ data: statsData }, { data: referralsData }] = await Promise.all([
        supabase.rpc("fn_get_affiliate_stats"),
        supabase.rpc("fn_get_recent_referrals", { p_limit: 10 }),
      ]);
      if (statsData) setStats(statsData as unknown as AffiliateStats);
      if (referralsData) setReferrals(referralsData as Referral[]);
    })();
  }, [profile, supabase]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Sign in to view your affiliate dashboard.</p>
        <Button asChild>
          <Link href="/sign-in?next=/affiliates">Sign In</Link>
        </Button>
      </div>
    );
  }

  const referralLink =
    typeof window !== "undefined" && stats?.referral_code
      ? `${window.location.origin}/sign-up?ref=${stats.referral_code}`
      : "";

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-6 px-3 py-4 lg:px-6 lg:py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Affiliate Overview</h1>
          <p className="text-sm text-muted-foreground">Earn commission on every player you refer.</p>
        </div>
        <Badge variant="secondary">This Month</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Your referral link</p>
            <p className="truncate text-sm font-medium text-foreground">
              {referralLink || "Loading…"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={copyLink} disabled={!referralLink}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Referrals" value={String(stats?.total_referrals ?? "…")} />
        <StatCard icon={UserCheck} label="Active Players" value={String(stats?.active_players ?? "…")} tone="win" />
        <StatCard
          icon={DollarSign}
          label="Total Commission"
          value={stats ? formatMoney(stats.total_commission) : "…"}
          tone="boost"
        />
        <StatCard
          icon={Clock}
          label="Pending Commission"
          value={stats ? formatMoney(stats.pending_commission) : "…"}
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Recent Referrals</h2>
        {referrals.length > 0 ? (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{r.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined{" "}
                      {new Date(r.created_at).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge>
                  <span className="w-20 text-right text-sm font-semibold text-win">{formatMoney(r.commission)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
            Share your referral link to start earning commission.
          </p>
        )}
      </section>
    </div>
  );
}
