import Link from "next/link";
import { Flame, Sparkles, Dice5, Tv, Rocket, Table, Gamepad2 } from "lucide-react";
import { getCasinoGames } from "@/lib/data/casino-games";
import { getHeroBanners } from "@/lib/data/banners";
import { HeroBanner } from "@/components/casino/hero-banner";
import { GameCard } from "@/components/casino/game-card";
import { ProviderStrip } from "@/components/casino/provider-strip";
import { SectionHeader } from "@/components/section-header";

const CATEGORIES = [
  { label: "Top Games", icon: Flame, href: "/slots?sort=top" },
  { label: "New", icon: Sparkles, href: "/slots?sort=new" },
  { label: "Slots", icon: Dice5, href: "/slots" },
  { label: "Live Casino", icon: Tv, href: "/live-casino" },
  { label: "Crash", icon: Rocket, href: "/slots?category=crash" },
  { label: "Table Games", icon: Table, href: "/live-casino?category=table" },
  { label: "Virtuals", icon: Gamepad2, href: "/slots?category=virtuals" },
];

export default async function LobbyPage() {
  const [games, banners] = await Promise.all([getCasinoGames(), getHeroBanners()]);
  const popularGames = games.slice(0, 12);

  return (
    <div className="flex flex-col gap-6 px-3 py-4 lg:px-6 lg:py-6">
      <HeroBanner banners={banners} />

      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent"
          >
            <cat.icon className="size-4 text-primary" />
            {cat.label}
          </Link>
        ))}
      </div>

      <section>
        <SectionHeader title="Popular Games" href="/slots" />
        {popularGames.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
            {popularGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
            No games published yet. Once the SoftGamings catalogue is synced this grid fills automatically.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Providers</h2>
        <ProviderStrip />
      </section>
    </div>
  );
}
