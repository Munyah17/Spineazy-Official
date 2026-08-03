"use client";

// MOCK LAYER — client-side simulated backend. Mirrors the real dual-balance
// rules from supabase/migrations/20260803000001_fund_split_chat_pay.sql
// (deposit-first spend, profit-only withdraw/gift) so the demo behaves like
// the real thing will once it's wired up. Delete this whole file, along
// with every `useMockStore` usage, when real Supabase/aggregator calls
// replace these actions.
import { create } from "zustand";
import {
  MOCK_WALLET,
  MOCK_TRANSACTIONS,
  MOCK_PENDING_WITHDRAWALS,
  MOCK_FUND_VIOLATIONS,
  MOCK_USER_ID,
  MOCK_OTHER_USER_ID,
  MOCK_OTHER_USER_NAME,
} from "@/lib/mock/data";
import type { Database } from "@/types/database";

type Wallet = Database["public"]["Tables"]["wallets"]["Row"];
type WalletTransaction = Database["public"]["Tables"]["wallet_transactions"]["Row"];
type WalletTxType = Database["public"]["Enums"]["wallet_tx_type"];

export type MockChatMessage = {
  id: string;
  sender_id: string;
  kind: "text" | "red_packet" | "voucher";
  body: string | null;
  created_at: string;
  redPacketAmount?: number;
  voucherId?: string;
  voucherAmount?: number;
  voucherCode?: string;
  voucherStatus?: "issued" | "redeemed";
};

let txCounter = 1000;
function nextId(prefix: string) {
  txCounter += 1;
  return `${prefix}-${txCounter}`;
}

function applyDelta(wallet: Wallet, type: WalletTxType, delta: number): Wallet {
  const next = { ...wallet, balance: wallet.balance + delta };

  if (type === "deposit" || type === "voucher_redeemed") {
    next.deposited_balance += delta;
  } else if (type === "bet_payout" || type === "cashout" || type === "gift_received") {
    if (delta > 0) next.profit_balance += delta;
  } else if (type === "gift_sent" || type === "withdrawal") {
    if (delta < 0) next.profit_balance += delta;
  } else if (type === "voucher_issued") {
    if (delta < 0) next.deposited_balance += delta;
  } else if (type === "bet_stake" || type === "bet_refund") {
    if (delta < 0) {
      const takeDeposit = Math.min(Math.abs(delta), Math.max(next.deposited_balance, 0));
      const takeProfit = Math.abs(delta) - takeDeposit;
      next.deposited_balance -= takeDeposit;
      next.profit_balance -= takeProfit;
    } else {
      next.deposited_balance += delta;
    }
  }

  return next;
}

interface MockState {
  wallet: Wallet;
  transactions: WalletTransaction[];
  chatMessages: MockChatMessage[];
  pendingWithdrawals: typeof MOCK_PENDING_WITHDRAWALS;
  fundViolations: typeof MOCK_FUND_VIOLATIONS;

  record: (type: WalletTxType, delta: number, description: string, referenceType: string) => void;
  deposit: (amount: number, description: string) => void;
  guardWithdrawal: (amount: number) => boolean;
  requestWithdrawal: (amount: number, method: string, phone: string) => void;
  sendChatMessage: (body: string) => void;
  sendRedPacket: (amount: number) => { ok: boolean; error?: string };
  issueVoucher: (amount: number) => { ok: boolean; code?: string; error?: string };
  redeemVoucher: (messageId: string) => void;
  approveWithdrawal: (id: string) => void;
  rejectWithdrawal: (id: string) => void;
  playGameRound: (stake: number) => { win: boolean; payout: number };
}

export const useMockStore = create<MockState>((set, get) => ({
  wallet: { ...MOCK_WALLET },
  transactions: [...MOCK_TRANSACTIONS],
  chatMessages: [
    {
      id: "cm1",
      sender_id: MOCK_OTHER_USER_ID,
      kind: "text",
      body: "Hey! Good luck tonight 🍀",
      created_at: "2026-08-01T18:40:00Z",
    },
    {
      id: "cm2",
      sender_id: MOCK_USER_ID,
      kind: "red_packet",
      body: null,
      redPacketAmount: 20,
      created_at: "2026-08-01T18:45:00Z",
    },
  ],
  pendingWithdrawals: [...MOCK_PENDING_WITHDRAWALS],
  fundViolations: [...MOCK_FUND_VIOLATIONS],

  record: (type, delta, description, referenceType) => {
    set((state) => {
      const wallet = applyDelta(state.wallet, type, delta);
      const tx: WalletTransaction = {
        id: nextId("tx"),
        wallet_id: wallet.id,
        user_id: MOCK_USER_ID,
        type,
        amount: delta,
        balance_before: state.wallet.balance,
        balance_after: wallet.balance,
        status: "completed",
        description,
        reference_id: nextId("ref"),
        reference_type: referenceType,
        created_by: null,
        created_at: new Date().toISOString(),
      };
      return { wallet, transactions: [tx, ...state.transactions] };
    });
  },

  deposit: (amount, description) => {
    get().record("deposit", amount, description, "deposit");
  },

  guardWithdrawal: (amount) => {
    const { wallet } = get();
    if (amount > wallet.profit_balance) {
      set((state) => ({
        fundViolations: [
          {
            id: nextId("fv"),
            user_id: MOCK_USER_ID,
            full_name: "You",
            kind: "withdrawal",
            attempted_amount: amount,
            available_profit_balance: wallet.profit_balance,
            deposited_balance_at_attempt: wallet.deposited_balance,
            created_at: new Date().toISOString(),
          },
          ...state.fundViolations,
        ],
      }));
      return false;
    }
    return true;
  },

  requestWithdrawal: (amount, method, phone) => {
    get().record("withdrawal", -amount, `${method} withdrawal to ${phone}`, "withdrawal");
  },

  sendChatMessage: (body) => {
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        { id: nextId("cm"), sender_id: MOCK_USER_ID, kind: "text", body, created_at: new Date().toISOString() },
      ],
    }));
  },

  sendRedPacket: (amount) => {
    const { wallet } = get();
    if (amount > wallet.profit_balance) {
      set((state) => ({
        fundViolations: [
          {
            id: nextId("fv"),
            user_id: MOCK_USER_ID,
            full_name: "You",
            kind: "red_packet",
            attempted_amount: amount,
            available_profit_balance: wallet.profit_balance,
            deposited_balance_at_attempt: wallet.deposited_balance,
            created_at: new Date().toISOString(),
          },
          ...state.fundViolations,
        ],
      }));
      return { ok: false, error: "insufficient_profit_balance" };
    }

    get().record("gift_sent", -amount, `Red packet to ${MOCK_OTHER_USER_NAME}`, "red_packet");
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: nextId("cm"),
          sender_id: MOCK_USER_ID,
          kind: "red_packet",
          body: null,
          redPacketAmount: amount,
          created_at: new Date().toISOString(),
        },
      ],
    }));
    return { ok: true };
  },

  issueVoucher: (amount) => {
    const { wallet } = get();
    if (amount > wallet.deposited_balance) {
      return { ok: false, error: "insufficient_deposited_balance" };
    }

    const code = Math.random().toString(36).slice(2, 12).toUpperCase();
    get().record("voucher_issued", -amount, `Voucher for ${MOCK_OTHER_USER_NAME}`, "voucher");
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: nextId("cm"),
          sender_id: MOCK_USER_ID,
          kind: "voucher",
          body: null,
          voucherId: nextId("v"),
          voucherAmount: amount,
          voucherCode: code,
          voucherStatus: "issued",
          created_at: new Date().toISOString(),
        },
      ],
    }));
    return { ok: true, code };
  },

  redeemVoucher: (messageId) => {
    set((state) => {
      const message = state.chatMessages.find((m) => m.id === messageId);
      if (!message || message.voucherStatus !== "issued") return state;
      return {
        chatMessages: state.chatMessages.map((m) =>
          m.id === messageId ? { ...m, voucherStatus: "redeemed" as const } : m
        ),
      };
    });
    const message = get().chatMessages.find((m) => m.id === messageId);
    if (message?.voucherAmount) {
      get().record("voucher_redeemed", message.voucherAmount, "Voucher redeemed", "voucher");
    }
  },

  approveWithdrawal: (id) => {
    set((state) => ({ pendingWithdrawals: state.pendingWithdrawals.filter((w) => w.id !== id) }));
  },

  rejectWithdrawal: (id) => {
    set((state) => ({ pendingWithdrawals: state.pendingWithdrawals.filter((w) => w.id !== id) }));
  },

  playGameRound: (stake) => {
    const win = Math.random() < 0.45;
    const payout = win ? Number((stake * (1.5 + Math.random() * 2)).toFixed(2)) : 0;

    get().record("bet_stake", -stake, "Demo game bet", "casino_aggregator_bet");
    if (win) {
      get().record("bet_payout", payout, "Demo game win", "casino_aggregator_win");
    }

    return { win, payout };
  },
}));
