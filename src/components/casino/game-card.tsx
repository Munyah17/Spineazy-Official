import Link from "next/link";
import { Play, Dice5, Tv, Rocket, Gamepad2, type LucideIcon } from "lucide-react";
import { gameArtGradient, gameArtRotation } from "@/lib/game-art";
import type { CasinoGame } from "@/lib/data/casino-games";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  slots: Dice5,
  live: Tv,
  crash: Rocket,
  virtuals: Gamepad2,
};

const CATEGORY_LABEL: Record<string, string> = {
  slots: "Slots",
  live: "Live",
  crash: "Crash",
  virtuals: "Instant",
};

export function GameCard({ game }: { game: CasinoGame }) {
  const category = game.category ?? "slots";
  const Icon = CATEGORY_ICON[category] ?? Dice5;
  const categoryLabel = CATEGORY_LABEL[category];

  return (
    <Link
      href={`/casino/${game.game_key}`}
      className="group/game relative flex aspect-[3/4] shrink-0 flex-col justify-end overflow-hidden rounded-2xl ring-1 ring-foreground/10 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.5)] hover:ring-primary/40"
    >
      {game.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- aggregator CDN host isn't known yet, see game-launch route
        <img
          src={game.thumbnail_url}
          alt={game.title}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-300 ease-out group-hover/game:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out group-hover/game:scale-105"
          style={{ background: gameArtGradient(game.game_key) }}
        >
          <Icon
            className="absolute -right-3 -bottom-3 size-24 text-white/10"
            style={{ transform: `rotate(${gameArtRotation(game.game_key)}deg)` }}
            strokeWidth={1.25}
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/5" />

      {categoryLabel && (
        <span className="absolute top-2.5 left-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/80 uppercase backdrop-blur-sm">
          {categoryLabel}
        </span>
      )}

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
