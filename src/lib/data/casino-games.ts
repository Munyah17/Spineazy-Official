import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database";

export type CasinoGame = Database["public"]["Tables"]["casino_games"]["Row"];

// Public, non-user-specific data -- cached briefly so the lobby isn't
// re-querying Supabase on every navigation (the (app) layout is dynamic
// because it reads cookies for the auth check).
export const getCasinoGames = unstable_cache(
  async (): Promise<CasinoGame[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("casino_games")
      .select("*")
      .eq("active", true)
      .order("display_order");

    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["casino-games"],
  { revalidate: 30, tags: ["casino-games"] }
);
