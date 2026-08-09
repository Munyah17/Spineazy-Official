import { createClient } from "@/lib/supabase/server";
import { SessionProvider } from "@/lib/auth/session-provider";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let wallet = null;

  if (user) {
    const [profileRes, walletRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("wallets").select("*").eq("user_id", user.id).single(),
    ]);
    profile = profileRes.data;
    wallet = walletRes.data;
  }

  return (
    <SessionProvider initialProfile={profile} initialWallet={wallet}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
