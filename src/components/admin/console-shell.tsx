"use client";

import { ConsoleSidebar } from "@/components/admin/console-sidebar";
import { ConsoleTopbar } from "@/components/admin/console-topbar";

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full">
      <ConsoleSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ConsoleTopbar />
        <main className="mx-auto min-w-0 w-full max-w-[1400px] flex-1">{children}</main>
      </div>
    </div>
  );
}
