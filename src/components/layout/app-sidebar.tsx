"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tv,
  Dice5,
  Trophy,
  Gift,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Users,
  MessageCircle,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/session-provider";
import { formatMoney, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SPORTSBOOK_URL } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/live-casino", label: "Live Casino", icon: Tv },
  { href: "/slots", label: "Casino", icon: Dice5 },
  { href: SPORTSBOOK_URL, label: "Sportsbook", icon: Trophy, external: true },
  { href: "/promotions", label: "Promotions", icon: Gift },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/wallet/deposit", label: "Deposit", icon: ArrowDownToLine },
  { href: "/wallet/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { href: "/my-bets", label: "History", icon: Receipt },
  { href: "/chat", label: "Chat & Pay", icon: MessageCircle },
  { href: "/affiliates", label: "Affiliates", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { profile, wallet, signOut } = useSession();
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="px-5 py-5">
        <Link href="/" aria-label="Spineazy home">
          <Logo className="text-xl" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            !item.external &&
            (item.href === "/" || item.href === "/wallet" ? pathname === item.href : pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="mt-3 mb-1 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Operations
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <ShieldCheck className="size-4.5" />
              Admin Console
            </Link>
          </>
        )}
      </nav>

      {profile && (
        <div className="flex items-center gap-3 border-t border-border p-4">
          <Link href="/account" className="flex min-w-0 flex-1 items-center gap-2.5">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                {initials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-sidebar-foreground">
                {profile.full_name}
              </span>
              <span className="block text-xs text-muted-foreground">{formatMoney(wallet?.balance ?? 0)}</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Log out"
            onClick={() => signOut()}
            className="text-destructive hover:text-destructive"
          >
            <LogOut className="size-4.5" />
          </Button>
        </div>
      )}
    </aside>
  );
}
