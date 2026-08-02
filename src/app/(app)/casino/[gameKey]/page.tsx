import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info, History as HistoryIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GameFrame } from "@/components/casino/game-frame";
import { formatMoney } from "@/lib/format";

export default async function GamePlayerPage({ params }: { params: Promise<{ gameKey: string }> }) {
  const { gameKey } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/casino/${gameKey}`);

  const [{ data: game }, { data: wallet }] = await Promise.all([
    supabase.from("casino_games").select("*").eq("game_key", gameKey).eq("active", true).single(),
    supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
  ]);

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
        <span className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground">
          {formatMoney(wallet?.balance ?? 0)}
        </span>
        <button className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="History">
          <HistoryIcon className="size-5" />
        </button>
        <button className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="Game info">
          <Info className="size-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 bg-black">
        <GameFrame gameKey={game.game_key} title={game.title} />
      </div>
    </div>
  );
}
