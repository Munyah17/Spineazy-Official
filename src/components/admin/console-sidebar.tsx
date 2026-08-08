"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, ShieldAlert, ChartColumnBig, ArrowLeftRight, LogOut } from "lucide-react";
import { useSession } from "@/lib/auth/session-provider";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true }],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, exact: false },
      { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowLeftRight, exact: false },
      { href: "/admin/fund-violations", label: "Fund Protection", icon: ShieldAlert, exact: false },
    ],
  },
];

const SUPER_ADMIN_SECTION = {
  label: "Platform",
  items: [{ href: "/admin/super", label: "Analytics", icon: ChartColumnBig, exact: false }],
};

export function ConsoleSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useSession();
  const isSuperAdmin = profile?.role === "super_admin";

  const sections = isSuperAdmin ? [...NAV_SECTIONS, SUPER_ADMIN_SECTION] : NAV_SECTIONS;

  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="font-sans text-lg font-extrabold tracking-tight select-none">
          <span className="text-foreground">SPIN</span>
          <span className="text-primary">EAZY</span>
        </span>
        <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
          Console
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pt-2">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border-l-2 py-2 pr-3 pl-3 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ArrowLeftRight className="size-4" />
          Exit to Player Site
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
