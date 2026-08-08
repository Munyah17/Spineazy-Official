import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionProvider } from "@/lib/auth/session-provider";
import { ConsoleShell } from "@/components/admin/console-shell";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { MOCK_PROFILE, MOCK_WALLET } from "@/lib/mock/data";

// Deliberately separate from src/app/(app)/layout.tsx -- the console is an
// operations tool for admin/super_admin roles, not the player app with a
// role check bolted on. No wallet, no game grid, no player nav ever renders
// here.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let profile = null;
  let wallet = null;

  if (USE_MOCK_DATA) {
    // MOCK: remove this branch (and src/lib/mock/) once real auth is live.
    profile = MOCK_PROFILE;
    wallet = MOCK_WALLET;
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in?next=/admin");

    const { data: profileRes } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profileRes || (profileRes.role !== "admin" && profileRes.role !== "super_admin")) redirect("/");
    profile = profileRes;

    const { data: walletRes } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
    wallet = walletRes;
  }

  return (
    <SessionProvider initialProfile={profile} initialWallet={wallet}>
      <ConsoleShell>{children}</ConsoleShell>
    </SessionProvider>
  );
}
