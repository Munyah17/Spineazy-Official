import { createClient } from "@/lib/supabase/server";
import { SessionProvider } from "@/lib/auth/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { MOCK_PROFILE, MOCK_WALLET } from "@/lib/mock/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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

    if (user) {
      const [profileRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("wallets").select("*").eq("user_id", user.id).single(),
      ]);
      profile = profileRes.data;
      wallet = walletRes.data;
    }
  }

  return (
    <SessionProvider initialProfile={profile} initialWallet={wallet}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
