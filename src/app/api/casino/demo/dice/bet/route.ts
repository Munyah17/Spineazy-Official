import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeRoll,
  diceMultiplier,
  isDiceWin,
  DICE_MIN_TARGET,
  DICE_MAX_TARGET,
  type DiceDirection,
} from "@/lib/games/provably-fair";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const betAmount = Number(body?.betAmount);
  const target = Number(body?.target);
  const direction = body?.direction as DiceDirection;

  if (!betAmount || betAmount <= 0) return NextResponse.json({ error: "Enter a valid bet amount" }, { status: 400 });
  if (!Number.isFinite(target) || target < DICE_MIN_TARGET || target > DICE_MAX_TARGET) {
    return NextResponse.json({ error: "Target out of range" }, { status: 400 });
  }
  if (direction !== "under" && direction !== "over") {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("casino_demo_sessions")
    .select("id, demo_balance, server_seed, server_seed_hash, client_seed, nonce")
    .eq("user_id", user.id)
    .eq("game_key", "dice")
    .maybeSingle();

  if (!session || !session.server_seed) {
    return NextResponse.json({ error: "No active session -- call /api/casino/demo/session first" }, { status: 400 });
  }
  if (betAmount > session.demo_balance) {
    return NextResponse.json({ error: "Insufficient demo balance" }, { status: 402 });
  }

  const roll = await computeRoll(session.server_seed, session.client_seed ?? "", session.nonce);
  const multiplier = diceMultiplier(target, direction);
  const won = isDiceWin(roll, target, direction);
  const payout = won ? Math.round(betAmount * multiplier * 100) / 100 : 0;
  const newBalance = Math.round((session.demo_balance - betAmount + payout) * 100) / 100;
  const nextNonce = session.nonce + 1;

  // Conditional update keyed on the nonce we read: if a concurrent request
  // already consumed this nonce, this affects 0 rows and we bail out instead
  // of overwriting balance/nonce with a stale computation (read-then-write
  // race). The client can retry, which re-fetches a fresh session/nonce.
  const { data: updated } = await admin
    .from("casino_demo_sessions")
    .update({ demo_balance: newBalance, nonce: nextNonce })
    .eq("id", session.id)
    .eq("nonce", session.nonce)
    .select("id")
    .maybeSingle();

  if (!updated) {
    return NextResponse.json({ error: "Bet conflict, please try again" }, { status: 409 });
  }

  await admin.from("casino_demo_dice_rounds").insert({
    session_id: session.id,
    user_id: user.id,
    server_seed_hash: session.server_seed_hash ?? "",
    client_seed: session.client_seed ?? "",
    nonce: session.nonce,
    roll,
    target,
    direction,
    bet_amount: betAmount,
    multiplier,
    payout,
    status: won ? "won" : "lost",
  });

  return NextResponse.json({
    roll,
    won,
    payout,
    multiplier,
    newBalance,
    nonce: nextNonce,
  });
}
