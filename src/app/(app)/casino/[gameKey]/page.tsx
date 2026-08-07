import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info, History as HistoryIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GameFrame } from "@/components/casino/game-frame";
import { DiceGame } from "@/components/casino/dice-game";
import { WalletBalancePill } from "@/components/casino/wallet-balance-pill";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { MOCK_GAMES } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import type { CasinoGame } from "@/lib/data/casino-games";

// In-house originals render their own full UI instead of the aggregator
// iframe host (GameFrame). Add new original game_keys here as they ship.
const ORIGINALS = new Set(["dice-roll"]);

export default async function GamePlayerPage({ params }: { params: Promise<{ gameKey: string }> }) {
  const { gameKey } = await params;

  let game: CasinoGame | null | undefined;

  if (USE_MOCK_DATA) {
    // MOCK: remove this branch once real auth + casino_games queries are live.
    game = MOCK_GAMES.find((g) => g.game_key === gameKey) ?? null;
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect(`/sign-in?next=/casino/${gameKey}`);

    const { data: gameData } = await supabase
      .from("casino_games")
      .select("*")
      .eq("game_key", gameKey)
      .eq("active", true)
      .single();
    game = gameData;
  }

  if (!game) notFound();

  return (
    <div className="flex h-[calc(100svh-4rem)] flex-col lg:h-[calc(100svh-4.5rem)]">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5 lg:px-6">
        <Link href="/slots" className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{game.title}</p>
          <p className="truncate text-xs text-muted-foreground">{game.provider}</p>
        </div>
        <WalletBalancePill />
        <button className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="History">
          <HistoryIcon className="size-5" />
        </button>
        <button className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="Game info">
          <Info className="size-5" />
        </button>
      </div>

      <div className={cn("min-h-0 flex-1", ORIGINALS.has(game.game_key) ? "bg-background" : "bg-black")}>
        {ORIGINALS.has(game.game_key) ? (
          <DiceGame />
        ) : (
          <GameFrame gameKey={game.game_key} title={game.title} />
        )}
      </div>
    </div>
  );
}
