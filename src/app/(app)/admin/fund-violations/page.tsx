import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FundViolationsClient } from "@/components/admin/fund-violations-client";

export default async function FundViolationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/fund-violations");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) redirect("/");

  return <FundViolationsClient />;
}
