"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";

export default function ProfilePage() {
  const { profile } = useSession();
  const supabase = createClient();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, country: country || null, date_of_birth: dateOfBirth || null })
      .eq("id", profile.id);
    setLoading(false);

    if (error) {
      toast.error("Couldn't save changes", { description: error.message });
      return;
    }
    toast.success("Profile updated");
  }

  if (!profile) return null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-3 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center gap-3">
        <Link href="/account" className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Personal Information</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Email</Label>
          <Input value={profile.email ?? ""} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Phone</Label>
          <Input value={profile.phone ?? ""} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Zimbabwe" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input id="dob" type="date" value={dateOfBirth ?? ""} onChange={(e) => setDateOfBirth(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
