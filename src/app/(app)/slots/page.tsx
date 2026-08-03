import { getCasinoGames } from "@/lib/data/casino-games";
import { GameCard } from "@/components/casino/game-card";
import { ProviderStrip } from "@/components/casino/provider-strip";

export default async function SlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; provider?: string }>;
}) {
  const { category, sort, provider } = await searchParams;
  const allGames = await getCasinoGames();

  let games = allGames.filter((g) => g.category !== "live");
  if (category) games = games.filter((g) => g.category === category);
  if (provider) games = games.filter((g) => g.provider === provider);
  if (sort === "new") games = [...games].reverse();

  return (
    <div className="flex flex-col gap-5 px-3 py-4 lg:px-6 lg:py-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Casino</h1>
        <p className="text-sm text-muted-foreground">Slots, crash games and virtuals from our licensed content partners.</p>
      </div>

      <ProviderStrip />

      {games.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          No games match this filter yet.
        </p>
      )}
    </div>
  );
}
