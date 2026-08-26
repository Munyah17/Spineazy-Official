import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Generic, provider-agnostic status read -- just reflects whatever the
// relevant webhook (EcoCash notifyUrl, Paynow resulturl) has already written
// to the deposits row. Used by the result page as a passive fallback for
// providers that don't expose an active poll endpoint of their own.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: deposit } = await supabase
    .from("deposits")
    .select("status, user_id")
    .eq("id", id)
    .single();

  if (!deposit || deposit.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // "processing" is our internal pre-confirmation state -- report it to the
  // client as "pending" so the result page keeps polling instead of stopping.
  const status = deposit.status === "processing" ? "pending" : deposit.status;
  return NextResponse.json({ status });
}
