"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { USE_MOCK_DATA } from "@/lib/mock/flag";
import { useMockStore } from "@/lib/mock/store";
import { formatMoney } from "@/lib/format";

type Violation = {
  id: string;
  user_id: string;
  full_name: string;
  kind: string;
  attempted_amount: number;
  available_profit_balance: number;
  deposited_balance_at_attempt: number;
  created_at: string;
};

export function FundViolationsClient() {
  const supabase = createClient();
  // MOCK: remove this + the USE_MOCK_DATA branch below once real RPC calls are live.
  const mockViolations = useMockStore((s) => s.fundViolations);
  const [violations, setViolations] = useState<Violation[] | null>(null);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      (async () => {
        await Promise.resolve();
        setViolations(mockViolations);
      })();
      return;
    }

    (async () => {
      const { data } = await supabase.rpc("fn_get_admin_fund_violations", { p_limit: 50 });
      setViolations((data as unknown as Violation[]) ?? []);
    })();
  }, [supabase, mockViolations]);

  return (
    <div className="flex flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
      <p className="text-sm text-muted-foreground">
        Attempts to withdraw or gift deposited (bet-only) funds. These are always blocked automatically — this is
        the audit trail.
      </p>

      {violations === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : violations.length > 0 ? (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {violations.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <ShieldAlert className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{v.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Tried {formatMoney(v.attempted_amount)} · had {formatMoney(v.available_profit_balance)}{" "}
                    withdrawable + {formatMoney(v.deposited_balance_at_attempt)} bet-only ·{" "}
                    {new Date(v.created_at).toLocaleString("en-US", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant="destructive">{v.kind === "withdrawal" ? "Withdrawal" : "Red Packet"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          No fund protection violations logged.
        </p>
      )}
    </div>
  );
}
