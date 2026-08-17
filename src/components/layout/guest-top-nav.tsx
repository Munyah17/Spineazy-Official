"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SPORTSBOOK_URL } from "@/lib/constants";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/slots", label: "Casino" },
  { href: "/live-casino", label: "Live Casino" },
  { href: SPORTSBOOK_URL, label: "Sportsbook", external: true },
  { href: "/promotions", label: "Promotions" },
];

export function GuestTopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="text-foreground/80 hover:text-foreground lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="size-5.5" /> : <Menu className="size-5.5" />}
        </button>

        <Link href="/" aria-label="Spineazy home">
          <Logo />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = !link.external && (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-foreground/75 hover:bg-secondary hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/sign-in">Login</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full glow-primary">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground/85 hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
