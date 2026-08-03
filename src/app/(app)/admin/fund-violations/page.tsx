import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { FundViolationsClient } from "@/components/admin/fund-violations-client";

export default async function FundViolationsPage() {
  if (!USE_MOCK_DATA) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in?next=/admin/fund-violations");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) redirect("/");
  }
  // MOCK: remove the guard above (real auth) once real Supabase auth is live -- mock mode assumes a super_admin session.

  return <FundViolationsClient />;
}
