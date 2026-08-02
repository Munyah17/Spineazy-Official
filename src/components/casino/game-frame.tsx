"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GameFrame({ gameKey, title }: { gameKey: string; title: string }) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "ready"; url: string } | { status: "unavailable"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/casino/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameKey }),
    })
      .then(async (res) => {
        if (cancelled) return;
        const data = await res.json();
        if (res.ok && data.url) {
          setState({ status: "ready", url: data.url });
        } else {
          setState({
            status: "unavailable",
            message:
              data.error === "not_configured"
                ? "This game will be playable as soon as the SoftGamings aggregator integration goes live."
                : (data.message ?? "This game couldn't be launched right now."),
          });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unavailable", message: "This game couldn't be launched right now." });
      });
    return () => {
      cancelled = true;
    };
  }, [gameKey]);

  if (state.status === "ready") {
    return (
      <iframe
        src={state.url}
        title={title}
        className="size-full border-0"
        allow="autoplay; fullscreen; payment"
      />
    );
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 px-6 text-center">
      {state.status === "loading" ? (
        <>
          <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading {title}…</p>
        </>
      ) : (
        <>
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Clock className="size-6" />
          </span>
          <div>
            <p className="font-semibold text-foreground">{title} is almost here</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{state.message}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/slots">
              <ArrowLeft className="size-4" />
              Back to games
            </Link>
          </Button>
        </>
      )}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <Sparkles className="size-3.5" />
        Powered by our licensed content partners
      </p>
    </div>
  );
}
