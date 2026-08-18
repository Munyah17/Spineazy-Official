"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  User,
  ShieldCheck,
  Lock,
  Receipt,
  Gift,
  HeartHandshake,
  LogOut,
  Crown,
  FileCheck,
  LifeBuoy,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";
import { formatMoney, initials } from "@/lib/format";

const MENU = [
  { href: "/account/profile", label: "Personal Information", icon: User },
  { href: "/account/security", label: "Account Security", icon: Lock },
  { href: "/wallet", label: "Transaction History", icon: Receipt },
  { href: "/promotions", label: "Bonuses", icon: Gift },
  { href: "/account/kyc", label: "Verify Identity", icon: FileCheck },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/account/responsible-gaming", label: "Responsible Gaming", icon: HeartHandshake },
];

export default function AccountPage() {
  const { profile, wallet, signOut } = useSession();
  const supabase = createClient();
  const [wageredThisMonth, setWageredThisMonth] = useState<number | null>(null);

  useEffect(() => {
    if (!profile) return;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    (async () => {
      const [{ data: bets }, { data: rounds }] = await Promise.all([
        supabase.from("bets").select("stake").eq("user_id", profile.id).gte("placed_at", monthStart.toISOString()),
        supabase
          .from("casino_demo_crash_rounds")
          .select("stake")
          .eq("user_id", profile.id)
          .gte("created_at", monthStart.toISOString()),
      ]);
      const total =
        (bets ?? []).reduce((sum, b) => sum + Number(b.stake), 0) +
        (rounds ?? []).reduce((sum, r) => sum + Number(r.stake), 0);
      setWageredThisMonth(total);
    })();
  }, [profile, supabase]);

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Sign in to view your account.</p>
        <Button asChild>
          <Link href="/sign-in?next=/account">Sign In</Link>
        </Button>
      </div>
    );
  }

  const isAdmin = profile.role === "admin" || profile.role === "super_admin";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-3 py-4 lg:px-0 lg:py-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg" className="size-16">
          <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
            {initials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-foreground">{profile.full_name}</p>
          <p className="truncate text-sm text-muted-foreground">{profile.phone ?? profile.email}</p>
          <Badge variant={profile.status === "active" ? "default" : "destructive"} className="mt-1">
            {profile.status === "active" ? "Active Member" : profile.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card p-3 text-center ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="mt-1 truncate text-sm font-bold text-foreground">{formatMoney(wallet?.balance ?? 0)}</p>
        </div>
        <div className="rounded-2xl bg-card p-3 text-center ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Bonus</p>
          <p className="mt-1 truncate text-sm font-bold text-foreground">{formatMoney(wallet?.bonus_balance ?? 0)}</p>
        </div>
        <div className="rounded-2xl bg-card p-3 text-center ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Wagered (mo.)</p>
          <p className="mt-1 truncate text-sm font-bold text-foreground">
            {wageredThisMonth === null ? "…" : formatMoney(wageredThisMonth)}
          </p>
        </div>
      </div>

      <Button asChild size="lg">
        <Link href="/wallet/deposit">Deposit</Link>
      </Button>

      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3.5 text-sm font-semibold text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/15"
        >
          <Crown className="size-4.5" />
          <span className="flex-1">Open Admin Console</span>
          <ChevronRight className="size-4" />
        </Link>
      )}

      <nav className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        {MENU.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground hover:bg-accent ${i !== 0 ? "border-t border-border" : ""}`}
          >
            <item.icon className="size-4.5 text-muted-foreground" />
            <span className="flex-1">{item.label}</span>
            {item.label === "Account Security" && (
              <ShieldCheck className="size-4 text-win" />
            )}
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </nav>

      <Button variant="destructive" onClick={() => signOut()} className="w-full">
        <LogOut className="size-4" /> Log Out
      </Button>
    </div>
  );
}
