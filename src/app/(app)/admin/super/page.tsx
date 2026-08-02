import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminDashboardClient } from "@/components/admin/super-admin-dashboard-client";

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/super");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/");

  return <SuperAdminDashboardClient />;
}
