"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, ShieldCheck, Menu, LayoutGrid, Users, ArrowLeftRight, ShieldAlert, ChartColumnBig, LogOut } from "lucide-react";
import { useSession } from "@/lib/auth/session-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Users",
  "/admin/withdrawals": "Withdrawals",
  "/admin/fund-violations": "Fund Protection",
  "/admin/super": "Platform Analytics",
};

const MOBILE_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowLeftRight },
  { href: "/admin/fund-violations", label: "Fund Protection", icon: ShieldAlert },
];

export function ConsoleTopbar() {
  const pathname = usePathname();
  const { profile, signOut } = useSession();
  const isSuperAdmin = profile?.role === "super_admin";
  const title = TITLES[pathname] ?? "Console";

  const links = isSuperAdmin ? [...MOBILE_LINKS, { href: "/admin/super", label: "Analytics", icon: ChartColumnBig }] : MOBILE_LINKS;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3.5 backdrop-blur lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open console menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetHeader className="border-b border-border px-4 py-4">
            <SheetTitle>
              <span className="font-sans text-lg font-extrabold tracking-tight">
                <span className="text-foreground">SPIN</span>
                <span className="text-primary">EAZY</span>
              </span>{" "}
              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                Console
              </span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-0.5 p-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/85 hover:bg-accent"
              >
                <l.icon className="size-4" />
                {l.label}
              </Link>
            ))}
            <Link
              href="/"
              className="mt-2 flex items-center gap-2.5 rounded-lg border-t border-border px-3 pt-4 pb-2 text-sm font-medium text-muted-foreground"
            >
              <ArrowLeftRight className="size-4" />
              Exit to Player Site
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive"
            >
              <LogOut className="size-4" />
              Log Out
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="text-base font-bold text-foreground">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
            isSuperAdmin ? "bg-boost/15 text-boost" : "bg-primary/15 text-primary"
          )}
        >
          {isSuperAdmin ? <Crown className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
          {isSuperAdmin ? "Super Admin" : "Admin"}
        </span>
        <span className="hidden text-sm font-medium text-muted-foreground sm:block">{profile?.full_name}</span>
      </div>
    </header>
  );
}
