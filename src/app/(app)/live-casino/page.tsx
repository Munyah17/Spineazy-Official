import { getCasinoGames } from "@/lib/data/casino-games";
import { LiveCasinoGrid } from "@/components/casino/live-casino-grid";

export default async function LiveCasinoPage() {
  const allGames = await getCasinoGames();
  const liveGames = allGames.filter((g) => g.category === "live");

  return (
    <div className="flex flex-col gap-5 px-3 py-4 lg:px-6 lg:py-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Live Casino</h1>
        <p className="text-sm text-muted-foreground">Real dealers, real tables, streamed live from our licensed studio partners.</p>
      </div>
      <LiveCasinoGrid games={liveGames} />
    </div>
  );
}
