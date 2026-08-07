import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomHex, sha256Hex } from "@/lib/games/provably-fair";

export const dynamic = "force-dynamic";

const STARTING_DEMO_BALANCE = 1000;

/**
 * Gets or creates a player's demo session for an in-house originals game
 * (e.g. "dice"), generating a fresh provably-fair server seed commitment if
 * one doesn't exist yet. Returns only the public commitment (hash) -- the
 * secret server_seed itself never leaves this route.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const gameKey = String(body?.gameKey ?? "");
  if (!gameKey) return NextResponse.json({ error: "Missing gameKey" }, { status: 400 });

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("casino_demo_sessions")
    .select("id, demo_balance, server_seed_hash, client_seed, nonce")
    .eq("user_id", user.id)
    .eq("game_key", gameKey)
    .maybeSingle();

  if (existing?.server_seed_hash) {
    return NextResponse.json({
      demoBalance: existing.demo_balance,
      serverSeedHash: existing.server_seed_hash,
      clientSeed: existing.client_seed,
      nonce: existing.nonce,
    });
  }

  const serverSeed = randomHex(32);
  const serverSeedHash = await sha256Hex(serverSeed);
  const clientSeed = randomHex(8);

  if (existing) {
    await admin
      .from("casino_demo_sessions")
      .update({ server_seed: serverSeed, server_seed_hash: serverSeedHash, client_seed: clientSeed, nonce: 0 })
      .eq("id", existing.id);

    return NextResponse.json({
      demoBalance: existing.demo_balance,
      serverSeedHash,
      clientSeed,
      nonce: 0,
    });
  }

  const { data: created, error } = await admin
    .from("casino_demo_sessions")
    .insert({
      user_id: user.id,
      game_key: gameKey,
      demo_balance: STARTING_DEMO_BALANCE,
      server_seed: serverSeed,
      server_seed_hash: serverSeedHash,
      client_seed: clientSeed,
      nonce: 0,
    })
    .select("demo_balance")
    .single();

  if (error || !created) {
    return NextResponse.json({ error: error?.message ?? "Could not start session" }, { status: 500 });
  }

  return NextResponse.json({
    demoBalance: created.demo_balance,
    serverSeedHash,
    clientSeed,
    nonce: 0,
  });
}
