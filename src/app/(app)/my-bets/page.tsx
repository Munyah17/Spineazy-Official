"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type HistoryEntry = {
  id: string;
  kind: "Sportsbook" | "Crash";
  label: string;
  stake: number;
  result: number;
  status: "won" | "lost" | "open" | "void";
  placedAt: string;
};

const STATUS_STYLE: Record<HistoryEntry["status"], string> = {
  won: "bg-win/15 text-win",
  lost: "bg-destructive/15 text-destructive",
  open: "bg-boost/15 text-boost",
  void: "bg-muted text-muted-foreground",
};

const PAGE_SIZE = 10;

export default function MyBetsPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<"all" | "sportsbook" | "crash">("all");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setEntries([]);
          setLoading(false);
        }
        return;
      }

      const [{ data: bets }, { data: rounds }] = await Promise.all([
        supabase
          .from("bets")
          .select("id, stake, potential_payout, status, placed_at, bet_type")
          .eq("user_id", user.id)
          .order("placed_at", { ascending: false })
          .limit(50),
        supabase
          .from("casino_demo_crash_rounds")
          .select("id, stake, payout, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const betEntries: HistoryEntry[] = (bets ?? []).map((b) => ({
        id: b.id,
        kind: "Sportsbook",
        label: b.bet_type === "single" ? "Single Bet" : b.bet_type === "multiple" ? "Multiple Bet" : "System Bet",
        stake: Number(b.stake),
        result: b.status === "won" ? Number(b.potential_payout) : Number(b.stake),
        status:
          b.status === "won"
            ? "won"
            : b.status === "lost"
              ? "lost"
              : b.status === "void"
                ? "void"
                : "open",
        placedAt: b.placed_at,
      }));

      const crashEntries: HistoryEntry[] = (rounds ?? []).map((r) => ({
        id: r.id,
        kind: "Crash",
        label: "Crash (Demo)",
        stake: Number(r.stake),
        result: Number(r.payout),
        status: r.status === "cashed_out" ? "won" : r.status === "crashed" ? "lost" : "open",
        placedAt: r.created_at,
      }));

      if (!cancelled) {
        setEntries(
          [...betEntries, ...crashEntries].sort(
            (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
          )
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filtered = entries.filter((e) => {
    if (tab === "sportsbook") return e.kind === "Sportsbook";
    if (tab === "crash") return e.kind === "Crash";
    return true;
  });
  const visible = filtered.slice(0, limit);

  return (
    <div className="flex flex-col gap-5 px-3 py-4 lg:px-6 lg:py-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Bets / Game History</h1>
        <p className="text-sm text-muted-foreground">Every stake you&apos;ve placed, sportsbook and crash.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="sportsbook">Sportsbook</TabsTrigger>
          <TabsTrigger value="crash">Crash</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : visible.length > 0 ? (
        <>
          <div className="flex flex-col gap-2">
            {visible.map((entry) => (
              <Card key={`${entry.kind}-${entry.id}`} size="sm">
                <CardContent className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Bet {formatMoney(entry.stake)} •{" "}
                      {new Date(entry.placedAt).toLocaleString("en-US", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={cn("text-sm font-semibold", entry.status === "won" ? "text-win" : "text-foreground")}>
                    {entry.status === "won" ? "+" : ""}
                    {formatMoney(entry.result)}
                  </span>
                  <Badge className={cn("border-0", STATUS_STYLE[entry.status])}>
                    {entry.status === "won" ? "WON" : entry.status === "lost" ? "LOST" : entry.status === "void" ? "VOID" : "OPEN"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length > visible.length && (
            <Button variant="outline" onClick={() => setLimit((l) => l + PAGE_SIZE)} className="mx-auto">
              Load More
            </Button>
          )}
        </>
      ) : (
        <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          No bets placed yet.
        </p>
      )}
    </div>
  );
}
