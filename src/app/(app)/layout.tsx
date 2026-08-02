import { createClient } from "@/lib/supabase/server";
import { SessionProvider } from "@/lib/auth/session-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Footer } from "@/components/layout/footer";

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
      <div className="flex min-h-svh w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <SiteHeader />
          <main className="mx-auto min-w-0 w-full max-w-[1600px] flex-1">{children}</main>
          <div className="pb-20 lg:pb-0">
            <Footer />
          </div>
        </div>
      </div>
      <BottomNav />
    </SessionProvider>
  );
}
