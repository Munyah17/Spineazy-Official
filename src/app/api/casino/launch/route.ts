import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { launchGame, SoftGamingsNotConfiguredError } from "@/lib/aggregator/softgamings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const gameKey = String(body?.gameKey ?? "");
  if (!gameKey) return NextResponse.json({ error: "Missing gameKey" }, { status: 400 });

  const { data: game } = await supabase
    .from("casino_games")
    .select("game_key, active")
    .eq("game_key", gameKey)
    .single();

  if (!game || !game.active) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const { data: wallet } = await supabase.from("wallets").select("currency").eq("user_id", user.id).single();

  try {
    const { url } = await launchGame({
      gameKey,
      playerId: user.id,
      currency: wallet?.currency ?? "USD",
      mode: "real",
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/casino/${gameKey}`,
    });
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof SoftGamingsNotConfiguredError) {
      return NextResponse.json({ error: "not_configured", message: e.message }, { status: 501 });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
