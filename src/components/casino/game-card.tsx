import Link from "next/link";
import { Play } from "lucide-react";
import { gameArtGradient } from "@/lib/game-art";
import type { CasinoGame } from "@/lib/data/casino-games";

export function GameCard({ game }: { game: CasinoGame }) {
  return (
    <Link
      href={`/casino/${game.game_key}`}
      className="group/game relative flex aspect-[3/4] shrink-0 flex-col justify-end overflow-hidden rounded-2xl ring-1 ring-foreground/10 transition-transform duration-200 ease-out hover:-translate-y-1 hover:ring-primary/40"
    >
      {game.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- aggregator CDN host isn't known yet, see game-launch route
        <img
          src={game.thumbnail_url}
          alt={game.title}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-200 ease-out group-hover/game:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out group-hover/game:scale-105"
          style={{ background: gameArtGradient(game.game_key) }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/game:opacity-100">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/90 text-primary-foreground glow-primary">
          <Play className="size-5 fill-current" />
        </span>
      </div>

      <div className="relative p-3">
        <p className="truncate text-sm font-semibold text-white">{game.title}</p>
        <p className="truncate text-xs text-white/60">{game.provider}</p>
      </div>
    </Link>
  );
}

export function GameCardSkeleton() {
  return <div className="aspect-[3/4] shrink-0 animate-pulse rounded-2xl bg-muted" />;
}
