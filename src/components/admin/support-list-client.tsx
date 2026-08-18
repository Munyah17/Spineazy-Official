"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type TicketRow = {
  id: string;
  user_id: string;
  full_name: string;
  subject: string;
  status: "open" | "pending" | "closed";
  created_at: string;
  updated_at: string;
  last_message: string | null;
};

const STATUS_STYLE: Record<TicketRow["status"], string> = {
  open: "bg-destructive/15 text-destructive",
  pending: "bg-boost/15 text-boost",
  closed: "bg-muted text-muted-foreground",
};

const FILTERS: { label: string; value: TicketRow["status"] | null }[] = [
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "Closed", value: "closed" },
  { label: "All", value: null },
];

export function AdminSupportListClient() {
  const supabase = createClient();
  const [filter, setFilter] = useState<TicketRow["status"] | null>("open");
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc("fn_get_support_tickets", { p_status: filter, p_limit: 100 });
      setTickets((data as unknown as TicketRow[]) ?? []);
      setLoading(false);
    })();
  }, [supabase, filter]);

  return (
    <div className="flex flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : tickets.length > 0 ? (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {tickets.map((t) => (
              <Link key={t.id} href={`/admin/support/${t.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{t.subject}</p>
                    <Badge className={cn("border-0 capitalize", STATUS_STYLE[t.status])}>{t.status}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.full_name} · {t.last_message ?? "No messages yet"}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          <LifeBuoy className="size-4 shrink-0" />
          No tickets in this view.
        </p>
      )}
    </div>
  );
}
