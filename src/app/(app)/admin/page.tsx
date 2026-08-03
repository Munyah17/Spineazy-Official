import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export default async function AdminPage() {
  if (!USE_MOCK_DATA) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in?next=/admin");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) redirect("/");
  }
  // MOCK: remove the guard above (real auth) once real Supabase auth is live -- mock mode assumes a super_admin session.

  return <AdminDashboardClient />;
}
