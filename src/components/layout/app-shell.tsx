"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { GuestTopNav } from "@/components/layout/guest-top-nav";
import { Footer } from "@/components/layout/footer";
import { useSession } from "@/lib/auth/session-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile } = useSession();

  if (!profile) {
    return (
      <div className="flex min-h-svh w-full flex-col">
        <GuestTopNav />
        <main className="mx-auto w-full max-w-[1600px] flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-svh w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <SiteHeader />
          <main className="mx-auto min-w-0 w-full max-w-[1600px] flex-1">{children}</main>
          <div className="pb-20 lg:pb-0">
            <Footer />
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
