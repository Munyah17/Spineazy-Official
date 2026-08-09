import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionProvider } from "@/lib/auth/session-provider";
import { ConsoleShell } from "@/components/admin/console-shell";

// Deliberately separate from src/app/(app)/layout.tsx -- the console is an
// operations tool for admin/super_admin roles, not the player app with a
// role check bolted on. No wallet, no game grid, no player nav ever renders
// here.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) redirect("/");

  const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();

  return (
    <SessionProvider initialProfile={profile} initialWallet={wallet}>
      <ConsoleShell>{children}</ConsoleShell>
    </SessionProvider>
  );
}
