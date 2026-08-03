import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { MOCK_GAMES } from "@/lib/mock/data";
import type { Database } from "@/types/database";

export type CasinoGame = Database["public"]["Tables"]["casino_games"]["Row"];

// Public, non-user-specific data -- cached briefly so the lobby isn't
// re-querying Supabase on every navigation (the (app) layout is dynamic
// because it reads cookies for the auth check).
export const getCasinoGames = unstable_cache(
  async (): Promise<CasinoGame[]> => {
    if (USE_MOCK_DATA) return MOCK_GAMES; // MOCK: remove with src/lib/mock/

    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("casino_games")
      .select("*")
      .eq("active", true)
      .order("display_order");

    if (error) {
      console.error("getCasinoGames failed:", error.message);
      return [];
    }
    return data ?? [];
  },
  ["casino-games"],
  { revalidate: 30, tags: ["casino-games"] }
);
