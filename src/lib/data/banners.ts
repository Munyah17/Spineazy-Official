import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database";

export type Banner = Database["public"]["Tables"]["banners"]["Row"];

export const getHeroBanners = unstable_cache(
  async (): Promise<Banner[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("active", true)
      .eq("kind", "hero_slide")
      .order("display_order");

    if (error) {
      console.error("getHeroBanners failed:", error.message);
      return [];
    }
    return data ?? [];
  },
  ["hero-banners"],
  { revalidate: 30, tags: ["banners"] }
);
