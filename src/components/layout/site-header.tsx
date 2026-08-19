"use client";

import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavSheet } from "@/components/layout/nav-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth/session-provider";
import { formatMoney, initials } from "@/lib/format";

export function SiteHeader() {
  const { profile, wallet } = useSession();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-3 py-3 backdrop-blur lg:px-6 lg:py-4">
      <div className="lg:hidden">
        <NavSheet />
      </div>

      <div className="relative hidden max-w-md flex-1 lg:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search games..."
          className="h-9 w-full rounded-lg border border-input bg-secondary/60 pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="ml-auto flex items-center justify-end gap-2">
        <div className="hidden items-center gap-1 lg:flex">
          <ThemeToggle />
          {profile && (
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="size-4.5" />
            </Button>
          )}
        </div>

        {profile ? (
          <>
            <Link
              href="/wallet"
              className="hidden items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent lg:flex"
            >
              {formatMoney(wallet?.balance ?? 0)}
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="size-3.5" />
              </span>
            </Link>
            <Link href="/account" aria-label="My account" className="lg:hidden">
              <Avatar>
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                  {initials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
