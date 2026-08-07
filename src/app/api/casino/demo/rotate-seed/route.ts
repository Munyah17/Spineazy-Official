import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomHex, sha256Hex } from "@/lib/games/provably-fair";

export const dynamic = "force-dynamic";

/**
 * Reveals the session's current (secret) server seed -- archiving it so
 * every round played against it stays independently verifiable -- then
 * commits to a fresh one. Optionally lets the player set their own client
 * seed, per the standard provably-fair flow.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const gameKey = String(body?.gameKey ?? "");
  const requestedClientSeed = typeof body?.clientSeed === "string" ? body.clientSeed.slice(0, 64) : null;
  if (!gameKey) return NextResponse.json({ error: "Missing gameKey" }, { status: 400 });

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("casino_demo_sessions")
    .select("id, server_seed, server_seed_hash, client_seed, nonce")
    .eq("user_id", user.id)
    .eq("game_key", gameKey)
    .maybeSingle();

  if (!session || !session.server_seed) {
    return NextResponse.json({ error: "No active session" }, { status: 400 });
  }

  await admin.from("casino_demo_seed_reveals").insert({
    session_id: session.id,
    user_id: user.id,
    server_seed: session.server_seed,
    server_seed_hash: session.server_seed_hash ?? "",
    client_seed: session.client_seed ?? "",
    rounds_used: session.nonce,
  });

  const newServerSeed = randomHex(32);
  const newServerSeedHash = await sha256Hex(newServerSeed);
  const newClientSeed = requestedClientSeed || session.client_seed || randomHex(8);

  await admin
    .from("casino_demo_sessions")
    .update({
      server_seed: newServerSeed,
      server_seed_hash: newServerSeedHash,
      client_seed: newClientSeed,
      nonce: 0,
    })
    .eq("id", session.id);

  return NextResponse.json({
    revealedServerSeed: session.server_seed,
    revealedServerSeedHash: session.server_seed_hash,
    newServerSeedHash,
    newClientSeed,
  });
}
