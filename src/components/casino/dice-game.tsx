"use client";

import { useEffect, useMemo, useState } from "react";
import { Dice5 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DICE_MIN_TARGET, DICE_MAX_TARGET, diceMultiplier, diceWinChance, type DiceDirection } from "@/lib/games/provably-fair";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type HistoryEntry = {
  id: string;
  roll: number;
  target: number;
  direction: DiceDirection;
  betAmount: number;
  payout: number;
  won: boolean;
};

// Fairness (server seed commit/reveal, HMAC verification) is enforced
// server-side in src/app/api/casino/demo/* -- see src/lib/games/provably-fair.ts.
// This screen only plays the game; it doesn't surface that plumbing to players.
export function DiceGame() {
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [demoBalance, setDemoBalance] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [betAmount, setBetAmount] = useState("1");
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<DiceDirection>("under");
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<{ roll: number; won: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/casino/demo/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameKey: "dice" }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;
        setDemoBalance(data.demoBalance);
        setReady(true);
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const winChance = useMemo(() => diceWinChance(target, direction), [target, direction]);
  const multiplier = useMemo(() => diceMultiplier(target, direction), [target, direction]);
  const potentialPayout = useMemo(() => (Number(betAmount) || 0) * multiplier, [betAmount, multiplier]);

  async function handleRoll() {
    const amount = Number(betAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid bet amount");
      return;
    }
    if (amount > demoBalance) {
      toast.error("Not enough demo credits");
      return;
    }

    setRolling(true);
    try {
      const res = await fetch("/api/casino/demo/dice/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount: amount, target, direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't place that bet");

      setDemoBalance(data.newBalance);
      setLastRoll({ roll: data.roll, won: data.won });
      setHistory((prev) =>
        [
          { id: `${Date.now()}`, roll: data.roll, target, direction, betAmount: amount, payout: data.payout, won: data.won },
          ...prev,
        ].slice(0, 10)
      );
      if (data.won) toast.success(`You won ${formatMoney(data.payout)}!`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRolling(false);
    }
  }

  if (unavailable) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <Dice5 className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Sign in to play Roll the Dice</p>
        <p className="text-xs text-muted-foreground">Practice mode needs an account to track your demo balance.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading demo table…
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4 overflow-y-auto p-3 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Dice5 className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">Roll the Dice</p>
            <p className="text-xs text-muted-foreground">Spineazy Originals · Practice Mode</p>
          </div>
        </div>
        <div className="rounded-xl bg-secondary px-3 py-1.5 text-right">
          <p className="text-[10px] text-muted-foreground uppercase">Demo Credits</p>
          <p className="text-sm font-bold text-foreground">{formatMoney(demoBalance)}</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-6">
          <div
            className={cn(
              "flex size-24 items-center justify-center rounded-full text-3xl font-extrabold ring-4 transition-colors",
              lastRoll === null
                ? "bg-secondary text-muted-foreground ring-border"
                : lastRoll.won
                  ? "bg-win/15 text-win ring-win/40 glow-win"
                  : "bg-destructive/15 text-destructive ring-destructive/40"
            )}
          >
            {lastRoll ? lastRoll.roll.toFixed(2) : "--"}
          </div>

          <div className="relative h-2 w-full max-w-sm rounded-full bg-secondary">
            <div
              className={cn(
                "absolute inset-y-0 rounded-full",
                direction === "under" ? "left-0 bg-win/50" : "right-0 bg-win/50"
              )}
              style={{ width: `${winChance}%` }}
            />
            <div
              className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-background"
              style={{ left: `calc(${target}% - 6px)` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Roll {direction} <span className="font-semibold text-foreground">{target}</span> to win
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="betAmount">
              Bet Amount
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="betAmount"
                  type="number"
                  min={0.1}
                  step="0.1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="pl-6"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setBetAmount((v) => String(Math.max(0.1, Number(v) / 2)))}>
                ½
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setBetAmount((v) => String(Number(v) * 2))}>
                2×
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={direction === "under" ? "default" : "outline"}
              onClick={() => setDirection("under")}
            >
              Roll Under
            </Button>
            <Button
              type="button"
              variant={direction === "over" ? "default" : "outline"}
              onClick={() => setDirection("over")}
            >
              Roll Over
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Target</span>
              <span className="font-semibold text-foreground">{target}</span>
            </div>
            <input
              type="range"
              min={DICE_MIN_TARGET}
              max={DICE_MAX_TARGET}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-secondary py-2">
              <p className="text-[10px] text-muted-foreground uppercase">Win Chance</p>
              <p className="text-sm font-bold text-foreground">{winChance.toFixed(2)}%</p>
            </div>
            <div className="rounded-lg bg-secondary py-2">
              <p className="text-[10px] text-muted-foreground uppercase">Multiplier</p>
              <p className="text-sm font-bold text-foreground">{multiplier.toFixed(2)}×</p>
            </div>
            <div className="rounded-lg bg-secondary py-2">
              <p className="text-[10px] text-muted-foreground uppercase">Payout</p>
              <p className="text-sm font-bold text-win">{formatMoney(potentialPayout)}</p>
            </div>
          </div>

          <Button size="lg" disabled={rolling} onClick={handleRoll} className="w-full glow-primary">
            {rolling ? "Rolling…" : "Roll"}
          </Button>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-2 p-0 divide-y divide-border">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={cn("text-sm font-bold", h.won ? "text-win" : "text-destructive")}>{h.roll.toFixed(2)}</span>
                <span className="flex-1 text-xs text-muted-foreground">
                  {h.direction} {h.target} · {formatMoney(h.betAmount)} bet
                </span>
                <span className={cn("text-sm font-semibold", h.won ? "text-win" : "text-muted-foreground")}>
                  {h.won ? `+${formatMoney(h.payout)}` : formatMoney(0)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
