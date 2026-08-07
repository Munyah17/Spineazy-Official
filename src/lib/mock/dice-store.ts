"use client";

// MOCK LAYER — client-side simulation of the real demo-dice API routes
// (src/app/api/casino/demo/{session,dice/bet,rotate-seed}/route.ts), using
// the exact same provably-fair algorithm. Delete this file + its usages
// once the game UI calls those routes directly instead.
import { create } from "zustand";
import {
  randomHex,
  sha256Hex,
  computeRoll,
  diceMultiplier,
  isDiceWin,
  type DiceDirection,
} from "@/lib/games/provably-fair";

export type DiceRoundRecord = {
  id: string;
  roll: number;
  target: number;
  direction: DiceDirection;
  betAmount: number;
  multiplier: number;
  payout: number;
  won: boolean;
  nonce: number;
  serverSeedHash: string;
  createdAt: string;
};

interface DiceState {
  initialized: boolean;
  demoBalance: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  history: DiceRoundRecord[];
  init: () => Promise<void>;
  play: (
    betAmount: number,
    target: number,
    direction: DiceDirection
  ) => Promise<{ won: boolean; roll: number; payout: number }>;
  rotateSeed: (newClientSeed?: string) => Promise<{ revealedServerSeed: string; revealedServerSeedHash: string }>;
}

export const useMockDiceStore = create<DiceState>((set, get) => ({
  initialized: false,
  demoBalance: 1000,
  serverSeed: "",
  serverSeedHash: "",
  clientSeed: "",
  nonce: 0,
  history: [],

  init: async () => {
    if (get().initialized) return;
    const serverSeed = randomHex(32);
    const serverSeedHash = await sha256Hex(serverSeed);
    const clientSeed = randomHex(8);
    set({ initialized: true, serverSeed, serverSeedHash, clientSeed, nonce: 0 });
  },

  play: async (betAmount, target, direction) => {
    const state = get();
    if (betAmount > state.demoBalance) throw new Error("Insufficient demo balance");

    const roll = await computeRoll(state.serverSeed, state.clientSeed, state.nonce);
    const multiplier = diceMultiplier(target, direction);
    const won = isDiceWin(roll, target, direction);
    const payout = won ? Math.round(betAmount * multiplier * 100) / 100 : 0;
    const newBalance = Math.round((state.demoBalance - betAmount + payout) * 100) / 100;

    set({
      demoBalance: newBalance,
      nonce: state.nonce + 1,
      history: [
        {
          id: `dice-${Date.now()}`,
          roll,
          target,
          direction,
          betAmount,
          multiplier,
          payout,
          won,
          nonce: state.nonce,
          serverSeedHash: state.serverSeedHash,
          createdAt: new Date().toISOString(),
        },
        ...state.history,
      ].slice(0, 50),
    });

    return { won, roll, payout };
  },

  rotateSeed: async (newClientSeed) => {
    const state = get();
    const revealedServerSeed = state.serverSeed;
    const revealedServerSeedHash = state.serverSeedHash;

    const serverSeed = randomHex(32);
    const serverSeedHash = await sha256Hex(serverSeed);
    const clientSeed = newClientSeed?.trim() || state.clientSeed;

    set({ serverSeed, serverSeedHash, clientSeed, nonce: 0 });
    return { revealedServerSeed, revealedServerSeedHash };
  },
}));
