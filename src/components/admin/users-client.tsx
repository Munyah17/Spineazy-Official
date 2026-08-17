"use client";

import { useEffect, useState } from "react";
import { Search, ShieldBan, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth/session-provider";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin" | "super_admin";
  status: "active" | "suspended" | "banned";
  created_at: string;
  last_login_at: string | null;
  balance: number;
};

const STATUS_STYLE: Record<UserRow["status"], string> = {
  active: "bg-win/15 text-win",
  suspended: "bg-boost/15 text-boost",
  banned: "bg-destructive/15 text-destructive",
};

export function UsersClient() {
  const supabase = createClient();
  const { profile } = useSession();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase.rpc("fn_get_users", { p_search: query || undefined, p_limit: 100 });
      setUsers((data as unknown as UserRow[]) ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [supabase, query]);

  async function toggleStatus(user: UserRow) {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    setBusyId(user.id);

    const { error } = await supabase.rpc("fn_set_user_status", { p_user_id: user.id, p_status: nextStatus });
    setBusyId(null);
    if (error) {
      toast.error("Couldn't update user", { description: error.message });
      return;
    }
    await supabase.rpc("fn_log_admin_action", {
      p_action: nextStatus === "active" ? "user_reactivated" : "user_suspended",
      p_target_type: "user",
      p_target_id: user.id,
      p_meta: { email: user.email },
    });
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
    toast.success(nextStatus === "active" ? "User reactivated" : "User suspended");
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2 text-[11px] font-bold tracking-wide text-muted-foreground uppercase sm:grid">
              <span>Player</span>
              <span>Balance</span>
              <span>Role</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-2 items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
                <div className="col-span-2 min-w-0 sm:col-span-1">
                  <p className="truncate text-sm font-semibold text-foreground">{u.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="font-mono text-sm text-foreground">{formatMoney(u.balance)}</span>
                <span className="text-xs font-medium text-muted-foreground capitalize">{u.role.replace("_", " ")}</span>
                <Badge className={cn("w-fit border-0 capitalize", STATUS_STYLE[u.status])}>{u.status}</Badge>
                <div className="flex justify-end">
                  {u.id !== profile?.id && u.status !== "banned" && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={busyId === u.id}
                      onClick={() => toggleStatus(u)}
                      className={u.status === "active" ? "text-destructive hover:text-destructive" : "text-win hover:text-win"}
                      aria-label={u.status === "active" ? "Suspend user" : "Reactivate user"}
                    >
                      {u.status === "active" ? <ShieldBan className="size-4" /> : <ShieldCheck className="size-4" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No players match this search.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
