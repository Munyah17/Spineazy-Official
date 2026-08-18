"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";

type Limits = {
  daily_deposit_limit: number | null;
  weekly_deposit_limit: number | null;
  monthly_deposit_limit: number | null;
  self_exclude_until: string | null;
};

export default function ResponsibleGamingPage() {
  const { profile } = useSession();
  const supabase = createClient();
  const [limits, setLimits] = useState<Limits | null>(null);
  const [daily, setDaily] = useState("");
  const [weekly, setWeekly] = useState("");
  const [monthly, setMonthly] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [days, setDays] = useState("30");
  const [excluding, setExcluding] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from("responsible_gaming_limits").select("*").eq("user_id", profile.id).maybeSingle();
      const row = data as Limits | null;
      setLimits(row);
      setDaily(row?.daily_deposit_limit != null ? String(row.daily_deposit_limit) : "");
      setWeekly(row?.weekly_deposit_limit != null ? String(row.weekly_deposit_limit) : "");
      setMonthly(row?.monthly_deposit_limit != null ? String(row.monthly_deposit_limit) : "");
    })();
  }, [profile, supabase]);

  const isExcluded = limits?.self_exclude_until && new Date(limits.self_exclude_until) > new Date();

  async function saveLimits() {
    setSaving(true);
    const { error } = await supabase.rpc("fn_set_deposit_limits", {
      p_daily: daily ? Number(daily) : null,
      p_weekly: weekly ? Number(weekly) : null,
      p_monthly: monthly ? Number(monthly) : null,
    });
    setSaving(false);
    if (error) {
      toast.error("Couldn't save limits", { description: error.message });
      return;
    }
    toast.success("Deposit limits updated");
  }

  async function confirmExclusion() {
    const numDays = Number(days);
    if (!numDays || numDays <= 0) {
      toast.error("Enter a valid number of days");
      return;
    }
    setExcluding(true);
    const { error } = await supabase.rpc("fn_set_self_exclusion", { p_days: numDays });
    setExcluding(false);
    if (error) {
      toast.error("Couldn't self-exclude", { description: error.message });
      return;
    }
    toast.success("You're self-excluded", { description: "Deposits are blocked until it expires." });
    setConfirmOpen(false);
    setLimits((l) => ({
      daily_deposit_limit: l?.daily_deposit_limit ?? null,
      weekly_deposit_limit: l?.weekly_deposit_limit ?? null,
      monthly_deposit_limit: l?.monthly_deposit_limit ?? null,
      self_exclude_until: new Date(Date.now() + numDays * 86400000).toISOString(),
    }));
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Sign in to manage responsible gaming settings.</p>
        <Button asChild>
          <Link href="/sign-in?next=/account/responsible-gaming">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-3 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center gap-3">
        <Link href="/account" className="text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Responsible Gaming</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Spineazy is committed to safer play. Gambling should always be entertainment, never a way to make
            money or escape problems.
          </p>
          <p>You must be 18 years or older to hold an account and play on Spineazy.</p>
        </CardContent>
      </Card>

      {isExcluded && limits?.self_exclude_until && (
        <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 px-4 py-3.5 text-sm text-destructive ring-1 ring-destructive/30">
          <ShieldAlert className="size-4.5 shrink-0" />
          You&apos;re self-excluded until {new Date(limits.self_exclude_until).toLocaleDateString()}. Deposits are blocked
          until then.
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <p className="font-semibold text-foreground">Deposit Limits</p>
          <p className="text-xs text-muted-foreground">Leave a field blank for no limit.</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="daily">Daily</Label>
              <Input id="daily" type="number" min={0} step="0.01" value={daily} onChange={(e) => setDaily(e.target.value)} placeholder="No limit" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="weekly">Weekly</Label>
              <Input id="weekly" type="number" min={0} step="0.01" value={weekly} onChange={(e) => setWeekly(e.target.value)} placeholder="No limit" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="monthly">Monthly</Label>
              <Input id="monthly" type="number" min={0} step="0.01" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="No limit" />
            </div>
          </div>

          <Button onClick={saveLimits} disabled={saving} className="w-fit">
            {saving ? "Saving…" : "Save Limits"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <p className="font-semibold text-foreground">Self-Exclusion</p>
          <p className="text-sm text-muted-foreground">
            Block yourself from depositing for a set number of days. This can&apos;t be undone early by yourself — contact
            support if you need it lifted.
          </p>
          <Button
            variant="destructive"
            className="mt-1 w-fit"
            disabled={!!isExcluded}
            onClick={() => setConfirmOpen(true)}
          >
            {isExcluded ? "Already Excluded" : "Self-Exclude"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="font-semibold text-foreground">Need more help?</p>
          <p className="text-muted-foreground">
            Email <span className="text-foreground">support@spineazy.com</span> or{" "}
            <Link href="/support" className="text-primary underline underline-offset-2">
              open a support ticket
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <span className="flex size-11 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <ShieldAlert className="size-5" />
            </span>
            <DialogTitle className="mt-2">Confirm self-exclusion</DialogTitle>
            <DialogDescription>
              You won&apos;t be able to deposit until this period ends, and you cannot undo it yourself. Enter the number
              of days.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="days">Days</Label>
            <Input id="days" type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmExclusion} disabled={excluding} className="w-full sm:w-auto">
              {excluding ? "Confirming…" : "Confirm Self-Exclusion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
