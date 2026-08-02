"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameCard } from "@/components/casino/game-card";
import type { CasinoGame } from "@/lib/data/casino-games";

const TABS = [
  { value: "all", label: "All", match: () => true },
  { value: "roulette", label: "Roulette", match: (t: string) => t.includes("roulette") },
  { value: "blackjack", label: "Blackjack", match: (t: string) => t.includes("blackjack") },
  { value: "baccarat", label: "Baccarat", match: (t: string) => t.includes("baccarat") },
  { value: "poker", label: "Poker", match: (t: string) => t.includes("poker") },
  { value: "game-shows", label: "Game Shows", match: (t: string) => !/roulette|blackjack|baccarat|poker/.test(t) },
];

export function LiveCasinoGrid({ games }: { games: CasinoGame[] }) {
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    const active = TABS.find((t) => t.value === tab) ?? TABS[0];
    return games.filter((g) => active.match(g.title.toLowerCase()));
  }, [games, tab]);

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="no-scrollbar w-full justify-start overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="shrink-0 grow-0">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          No live tables in this category yet.
        </p>
      )}
    </div>
  );
}
