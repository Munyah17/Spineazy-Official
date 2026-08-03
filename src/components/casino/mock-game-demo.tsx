"use client";

// MOCK LAYER — stands in for the real SoftGamings iframe game until the
// aggregator integration is live. Delete this file and the USE_MOCK_DATA
// branch in game-frame.tsx that renders it once /api/casino/launch returns
// real game URLs.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMockStore } from "@/lib/mock/store";
import { gameArtGradient } from "@/lib/game-art";
import { formatMoney } from "@/lib/format";

const STAKES = [1, 5, 10, 25];

export function MockGameDemo({ gameKey, title }: { gameKey: string; title: string }) {
  const playRound = useMockStore((s) => s.playGameRound);
  const [stake, setStake] = useState(5);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ win: boolean; payout: number } | null>(null);

  async function handleSpin() {
    setSpinning(true);
    setResult(null);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const outcome = playRound(stake);
    setResult(outcome);
    setSpinning(false);
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        className="flex h-40 w-64 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg"
        style={{ background: gameArtGradient(gameKey) }}
      >
        {spinning ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="size-10 rounded-full border-4 border-white/40 border-t-white"
          />
        ) : (
          title
        )}
      </div>

      <AnimatePresence mode="wait">
        {result && !spinning && (
          <motion.p
            key={result.win ? "win" : "lose"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-lg font-bold ${result.win ? "text-win" : "text-muted-foreground"}`}
          >
            {result.win ? `You won ${formatMoney(result.payout)}!` : "No win this round"}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {STAKES.map((s) => (
          <button
            key={s}
            onClick={() => setStake(s)}
            disabled={spinning}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              stake === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            ${s}
          </button>
        ))}
      </div>

      <Button onClick={handleSpin} disabled={spinning} size="lg" className="w-48 glow-primary">
        {spinning ? "Spinning…" : `Bet ${formatMoney(stake)}`}
      </Button>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <Sparkles className="size-3.5" />
        Demo mode — simulated outcome, not connected to a real game engine
      </p>
    </div>
  );
}
