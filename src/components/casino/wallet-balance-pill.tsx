"use client";

import { useSession } from "@/lib/auth/session-provider";
import { formatMoney } from "@/lib/format";

export function WalletBalancePill() {
  const { wallet } = useSession();
  return (
    <span className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground">
      {formatMoney(wallet?.balance ?? 0)}
    </span>
  );
}
