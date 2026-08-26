"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/session-provider";

// Paynow redirects the browser here after the hosted payment page, but the
// webhook (server-to-server, independent of this page) is the authoritative
// source of truth for whether the deposit actually completed -- this page
// polls the same status check the webhook feeds into, purely for user
// feedback. Bounded polling only: never spin forever on an unclear result.
const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 40; // ~2 minutes

type Status = "checking" | "pending" | "completed" | "failed" | "timeout";

export default function DepositResultPage() {
  return (
    <Suspense>
      <DepositResult />
    </Suspense>
  );
}

function DepositResult() {
  const searchParams = useSearchParams();
  const depositId = searchParams.get("depositId");
  // Paynow exposes an active poll endpoint we can query directly for a fast
  // result. Other providers (EcoCash) only confirm via their own webhook, so
  // we fall back to passively reading whatever the webhook has written.
  const provider = searchParams.get("provider") ?? "paynow";
  const statusUrl =
    provider === "paynow" ? `/api/deposits/paynow/${depositId}/status` : `/api/deposits/${depositId}/status`;
  const { refreshWallet } = useSession();
  const [status, setStatus] = useState<Status>("checking");
  const attemptsRef = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!depositId) {
      setStatus("failed");
      return;
    }

    cancelledRef.current = false;

    async function check() {
      attemptsRef.current += 1;
      try {
        const res = await fetch(statusUrl, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (cancelledRef.current) return;

        if (data?.status === "completed") {
          setStatus("completed");
          refreshWallet();
          return;
        }
        if (data?.status === "failed") {
          setStatus("failed");
          return;
        }
        // "pending" or a network hiccup -- keep polling, don't jump to failed.
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setStatus("timeout");
          return;
        }
        setStatus("pending");
        setTimeout(check, POLL_INTERVAL_MS);
      } catch {
        if (cancelledRef.current) return;
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setStatus("timeout");
          return;
        }
        setStatus("pending");
        setTimeout(check, POLL_INTERVAL_MS);
      }
    }

    check();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositId]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      {(status === "checking" || status === "pending") && (
        <>
          <Loader2 className="size-10 animate-spin text-primary" />
          <h1 className="text-xl font-bold text-foreground">Confirming your payment…</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Don&apos;t close this page. We&apos;re checking with Paynow -- this usually takes a few seconds.
          </p>
        </>
      )}

      {status === "completed" && (
        <>
          <CheckCircle2 className="size-12 text-win" />
          <h1 className="text-xl font-bold text-foreground">Deposit successful</h1>
          <p className="max-w-xs text-sm text-muted-foreground">Your wallet has been credited.</p>
          <Button asChild className="mt-2 w-full">
            <Link href="/wallet">Go to Wallet</Link>
          </Button>
        </>
      )}

      {status === "failed" && (
        <>
          <XCircle className="size-12 text-destructive" />
          <h1 className="text-xl font-bold text-foreground">Payment not completed</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Paynow reported this payment as cancelled or unsuccessful. No funds should have left your account --
            we never capture payment details ourselves, Paynow processes the transaction directly. If money was
            deducted, contact support with this reference and we&apos;ll resolve it.
          </p>
          {depositId && <p className="text-xs text-muted-foreground/70">Reference: {depositId}</p>}
          <div className="mt-2 flex w-full gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/support">Contact Support</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/wallet/deposit">Try Again</Link>
            </Button>
          </div>
        </>
      )}

      {status === "timeout" && (
        <>
          <Clock className="size-12 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Still confirming…</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            This is taking longer than usual. Your payment is still being confirmed in the background and will be
            credited automatically the moment Paynow responds -- no need to pay again. Check your wallet in a few
            minutes.
          </p>
          {depositId && <p className="text-xs text-muted-foreground/70">Reference: {depositId}</p>}
          <div className="mt-2 flex w-full gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/support">Contact Support</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/wallet">Check Wallet</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
