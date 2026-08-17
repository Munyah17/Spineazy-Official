import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * SoftGamings seamless-wallet callback.
 *
 * STATUS: scaffold -- SoftGamings' technical integration guide (exact action
 * names, payload field names, and header name/encoding for their signature)
 * has not been provided yet. DO NOT point SoftGamings at this URL in
 * production until:
 *   1. The header name and signature encoding (hex vs base64) below are
 *      confirmed against their real docs and SOFTGAMINGS_WEBHOOK_SECRET is
 *      set to the shared secret they issue.
 *   2. The action/field names are confirmed against their docs.
 *
 * Signature verification now does a real constant-time HMAC-SHA256 check
 * (previously it only checked that a header was present), and every
 * debit/credit/rollback is recorded in webhook_events keyed on
 * (provider, transaction_id, action) so a retried callback is a no-op
 * instead of double-processing.
 *
 * The wallet math itself reuses the same fn_wallet_debit / fn_wallet_credit
 * RPCs the sportsbook and deposit flows already use, so once the contract
 * above is confirmed, only the parsing/signature scheme in this file needs
 * to change.
 */

type CallbackAction = "balance" | "debit" | "credit" | "rollback";

interface SoftGamingsCallback {
  action: CallbackAction;
  playerId: string;
  transactionId: string;
  roundId?: string;
  gameId?: string;
  amount?: number;
  currency?: string;
}

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.SOFTGAMINGS_WEBHOOK_SECRET;
  const signature = req.headers.get("x-softgamings-signature");
  if (!secret || !signature || rawBody.length === 0) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  let provided: Buffer;
  let expectedBuf: Buffer;
  try {
    provided = Buffer.from(signature, "hex");
    expectedBuf = Buffer.from(expected, "hex");
  } catch {
    return false;
  }
  if (provided.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(provided, expectedBuf);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifySignature(req, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as SoftGamingsCallback;
  const admin = createAdminClient();

  const { data: wallet } = await admin
    .from("wallets")
    .select("id, balance, bonus_balance, locked_balance")
    .eq("user_id", payload.playerId)
    .single();

  if (!wallet) {
    return NextResponse.json({ error: "Unknown player" }, { status: 404 });
  }

  if (payload.action === "balance") {
    return NextResponse.json({ balance: wallet.balance, currency: payload.currency ?? "USD" });
  }

  // Idempotency: reserve (provider, transaction_id, action) before touching
  // the wallet. A unique-constraint conflict means we've already processed
  // this exact callback -- return success without reprocessing.
  const { error: dedupeError } = await admin
    .from("webhook_events")
    .insert({ provider: "softgamings", transaction_id: payload.transactionId, action: payload.action });

  if (dedupeError) {
    if (dedupeError.code === "23505") {
      return NextResponse.json({ status: "ok", note: "duplicate callback, already processed" });
    }
    return NextResponse.json({ error: "Could not record callback" }, { status: 500 });
  }

  switch (payload.action) {
    case "debit": {
      const amount = Number(payload.amount ?? 0);
      if (amount > wallet.balance) {
        return NextResponse.json({ error: "Insufficient balance", balance: wallet.balance }, { status: 402 });
      }
      await admin.rpc("fn_wallet_debit", {
        p_user_id: payload.playerId,
        p_amount: amount,
        p_type: "bet_stake",
        p_reference_id: payload.transactionId,
        p_reference_type: "casino_aggregator_bet",
        p_description: `Casino bet — ${payload.gameId ?? "unknown game"}`,
      });
      return NextResponse.json({ status: "ok", balance: wallet.balance - amount });
    }
    case "credit": {
      const amount = Number(payload.amount ?? 0);
      await admin.rpc("fn_wallet_credit", {
        p_user_id: payload.playerId,
        p_amount: amount,
        p_type: "bet_payout",
        p_reference_id: payload.transactionId,
        p_reference_type: "casino_aggregator_win",
        p_description: `Casino win — ${payload.gameId ?? "unknown game"}`,
      });
      return NextResponse.json({ status: "ok", balance: wallet.balance + amount });
    }
    case "rollback": {
      // TODO(softgamings-integration): reverse the referenced transaction id
      // via wallet_transactions lookup once the rollback contract is known.
      return NextResponse.json({ status: "ok" });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
