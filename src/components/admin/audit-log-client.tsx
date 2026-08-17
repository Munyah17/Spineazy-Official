"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type AuditRow = {
  id: number;
  admin_id: string;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

const ACTION_LABEL: Record<string, string> = {
  withdrawal_approved: "Approved withdrawal",
  withdrawal_rejected: "Rejected withdrawal",
  user_suspended: "Suspended user",
  user_reactivated: "Reactivated user",
  kyc_document_reviewed: "Reviewed KYC document",
};

export function AuditLogClient() {
  const supabase = createClient();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("fn_get_admin_audit_log", { p_limit: 200 });
      setRows((data as unknown as AuditRow[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  return (
    <div className="flex flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
      <p className="text-sm text-muted-foreground">Every approval, rejection, and status change made by an admin.</p>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : rows.length > 0 ? (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {ACTION_LABEL[r.action] ?? r.action} <span className="font-normal text-muted-foreground">by {r.admin_name}</span>
                  </p>
                  {r.meta && Object.keys(r.meta).length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">
                      {Object.entries(r.meta)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          <History className="size-4 shrink-0" />
          No admin actions recorded yet.
        </p>
      )}
    </div>
  );
}
