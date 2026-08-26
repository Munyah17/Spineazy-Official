import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ecocashCharge, normalizeMsisdn, isSuccessStatusMessage } from "@/lib/ecocash/client";
import { sendEmail } from "@/lib/email/send";
import { depositCompletedEmail } from "@/lib/email/templates";
import { formatMoney } from "@/lib/format";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const STATUS_MESSAGE_HINTS: Record<string, string> = {
  "Insufficient Balance": "Insufficient EcoCash balance. Top up your wallet and try again.",
  "Transaction Failed - Invalid PIN": "Incorrect PIN entered on the USSD prompt. Please try again.",
  "Transaction Limit Exceeded": "This exceeds your EcoCash transaction limit.",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount);
  const phone = String(body?.phone ?? "");

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Enter your EcoCash number" }, { status: 400 });
  }

  const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", user.id).single();
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 400 });

  const { data: allowedRows } = await supabase.rpc("fn_check_deposit_allowed", { p_user_id: user.id, p_amount: amount });
  const guard = allowedRows?.[0];
  if (guard && !guard.allowed) {
    return NextResponse.json({ error: guard.reason ?? "Deposit not allowed" }, { status: 403 });
  }

  const clientCorrelator = `EZY${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const endUserId = normalizeMsisdn(phone);

  const { data: deposit, error: insertErr } = await supabase
    .from("deposits")
    .insert({
      user_id: user.id,
      wallet_id: wallet.id,
      method: "ecocash",
      provider: "ecocash_direct",
      amount,
      phone_number: phone,
      client_correlator: clientCorrelator,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertErr || !deposit) {
    return NextResponse.json({ error: insertErr?.message ?? "Could not start deposit" }, { status: 500 });
  }

  const admin = createAdminClient();

  try {
    const charge = await ecocashCharge({
      clientCorrelator,
      referenceCode: deposit.id,
      endUserId,
      amount,
      notifyUrl: process.env.ECOCASH_NOTIFY_URL,
    });

    await admin
      .from("deposits")
      .update({
        provider_transaction_id: charge.transactionId ?? null,
        provider_payload: charge as unknown as Json,
      })
      .eq("id", deposit.id);

    if (isSuccessStatusMessage(charge.statusMessage)) {
      await admin.rpc("fn_complete_deposit", { p_deposit_id: deposit.id });
      await admin.rpc("fn_record_referral_commission", {
        p_referred_user_id: user.id,
        p_deposit_id: deposit.id,
        p_amount: amount,
      });
      if (user.email) {
        await sendEmail(user.email, "Deposit received", depositCompletedEmail(formatMoney(amount), "EcoCash"));
      }
      return NextResponse.json({ status: "completed", depositId: deposit.id, amount });
    }

    await admin.rpc("fn_fail_deposit", { p_deposit_id: deposit.id });
    await admin.from("deposits").update({ status: "failed" }).eq("id", deposit.id);

    return NextResponse.json(
      {
        status: "failed",
        depositId: deposit.id,
        message: STATUS_MESSAGE_HINTS[charge.statusMessage] ?? charge.statusMessage,
      },
      { status: 402 }
    );
  } catch (e) {
    // A thrown/timed-out request to EcoCash is NOT the same as EcoCash
    // declining the charge -- the USSD prompt on the user's phone may still
    // be awaiting their PIN, or may have already succeeded, when our HTTP
    // call to EcoCash's API times out on our end. Marking this "failed" here
    // would be a lie: the deposit stays "processing" and the notifyUrl
    // webhook (or a manual admin reconciliation) resolves it once EcoCash's
    // real outcome is known. Never tell the user "failed" when we simply
    // don't know yet.
    console.error("ecocash charge request failed (deposit left processing):", (e as Error).message);
    return NextResponse.json(
      { status: "pending", depositId: deposit.id, message: "Still confirming with EcoCash." },
      { status: 202 }
    );
  }
}
