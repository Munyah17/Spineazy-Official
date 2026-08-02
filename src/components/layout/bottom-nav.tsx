"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tv, Dice5, Gift, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/live-casino", label: "Live Casino", icon: Tv },
  { href: "/slots", label: "Casino", icon: Dice5 },
  { href: "/promotions", label: "Promotions", icon: Gift },
  { href: "/my-bets", label: "My Bets", icon: Receipt },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-center">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
