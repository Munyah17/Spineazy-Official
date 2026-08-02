import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * SoftGamings seamless-wallet callback.
 *
 * STATUS: scaffold only -- SoftGamings' technical integration guide (exact
 * action names, payload field names, and the request-signing scheme) has
 * not been provided yet. DO NOT point SoftGamings at this URL in production
 * until:
 *   1. Signature verification below is replaced with their real scheme.
 *   2. The action/field names are confirmed against their docs.
 *   3. Idempotency is confirmed (aggregators retry on timeout -- reusing a
 *      transaction id must be a no-op, not a double debit/credit).
 *
 * The wallet math itself reuses the same fn_wallet_debit / fn_wallet_credit
 * RPCs the sportsbook and deposit flows already use, so once the contract
 * above is confirmed, only the parsing in this file needs to change.
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
  // TODO(softgamings-integration): replace with their real HMAC/signature
  // scheme once documented -- this only checks a signature header is present.
  const signature = req.headers.get("x-softgamings-signature");
  return Boolean(process.env.SOFTGAMINGS_API_KEY) && Boolean(signature) && rawBody.length > 0;
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

  switch (payload.action) {
    case "balance": {
      return NextResponse.json({ balance: wallet.balance, currency: payload.currency ?? "USD" });
    }
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
