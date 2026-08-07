// MOCK LAYER — static seed data for demo/UI-review mode. Shapes match the
// real Supabase row types exactly, so swapping a page from mock to a real
// query is just deleting the `if (USE_MOCK_DATA)` branch that returns these.
import type { CasinoGame } from "@/lib/data/casino-games";
import type { Banner } from "@/lib/data/banners";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Wallet = Database["public"]["Tables"]["wallets"]["Row"];
type Promotion = Database["public"]["Tables"]["promotions"]["Row"];
type WalletTransaction = Database["public"]["Tables"]["wallet_transactions"]["Row"];

export const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

export const MOCK_PROFILE: Profile = {
  id: MOCK_USER_ID,
  full_name: "Tendai Moyo",
  email: "tendai@example.com",
  phone: "+263712345678",
  avatar_url: null,
  country: "Zimbabwe",
  date_of_birth: "1996-04-12",
  referral_code: "TENDAI24",
  referred_by: null,
  role: "super_admin",
  status: "active",
  created_at: "2026-01-15T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
  last_login_at: "2026-08-03T08:30:00Z",
};

export const MOCK_WALLET: Wallet = {
  id: "10000000-0000-0000-0000-000000000001",
  user_id: MOCK_USER_ID,
  balance: 325.5,
  bonus_balance: 15,
  locked_balance: 0,
  deposited_balance: 100,
  profit_balance: 225.5,
  currency: "USD",
  created_at: "2026-01-15T09:00:00Z",
  updated_at: "2026-08-03T08:30:00Z",
};

export const MOCK_GAMES: CasinoGame[] = [
  { id: "g0", game_key: "dice-roll", title: "Roll the Dice", provider: "Spineazy Originals", category: "originals", thumbnail_url: null, active: true, display_order: 0, demo_available: true, rtp: 99 },
  { id: "g1", game_key: "sweet-bonanza", title: "Sweet Bonanza", provider: "Pragmatic Play", category: "slots", thumbnail_url: null, active: true, display_order: 1, demo_available: true, rtp: 96.48 },
  { id: "g2", game_key: "gates-of-olympus", title: "Gates of Olympus", provider: "Pragmatic Play", category: "slots", thumbnail_url: null, active: true, display_order: 2, demo_available: true, rtp: 96.5 },
  { id: "g3", game_key: "book-of-dead", title: "Book of Dead", provider: "Play'n GO", category: "slots", thumbnail_url: null, active: true, display_order: 3, demo_available: true, rtp: 96.21 },
  { id: "g4", game_key: "wanted-dead-or-a-wild", title: "Wanted Dead or a Wild", provider: "Hacksaw Gaming", category: "slots", thumbnail_url: null, active: true, display_order: 4, demo_available: true, rtp: 96.38 },
  { id: "g5", game_key: "big-bass-bonanza", title: "Big Bass Bonanza", provider: "Pragmatic Play", category: "slots", thumbnail_url: null, active: true, display_order: 5, demo_available: true, rtp: 96.71 },
  { id: "g6", game_key: "sugar-rush", title: "Sugar Rush", provider: "Pragmatic Play", category: "slots", thumbnail_url: null, active: true, display_order: 6, demo_available: true, rtp: 96.5 },
  { id: "g7", game_key: "book-of-ra", title: "Book of Ra Deluxe", provider: "Novomatic", category: "slots", thumbnail_url: null, active: true, display_order: 7, demo_available: true, rtp: 95.1 },
  { id: "g8", game_key: "valley-of-the-gods", title: "Valley of the Gods", provider: "Yggdrasil", category: "slots", thumbnail_url: null, active: true, display_order: 8, demo_available: true, rtp: 96.3 },
  { id: "g9", game_key: "mental", title: "Mental", provider: "Nolimit City", category: "slots", thumbnail_url: null, active: true, display_order: 9, demo_available: true, rtp: 96.08 },
  { id: "g10", game_key: "fire-joker", title: "Fire Joker", provider: "Play'n GO", category: "slots", thumbnail_url: null, active: true, display_order: 10, demo_available: true, rtp: 96.15 },
  { id: "g11", game_key: "lightning-roulette", title: "Lightning Roulette", provider: "Evolution Gaming", category: "live", thumbnail_url: null, active: true, display_order: 11, demo_available: false, rtp: 97.3 },
  { id: "g12", game_key: "crazy-time", title: "Crazy Time", provider: "Evolution Gaming", category: "live", thumbnail_url: null, active: true, display_order: 12, demo_available: false, rtp: 96.08 },
  { id: "g13", game_key: "blackjack-party", title: "Blackjack Party", provider: "Pragmatic Live", category: "live", thumbnail_url: null, active: true, display_order: 13, demo_available: false, rtp: 99.28 },
  { id: "g14", game_key: "baccarat-squeeze", title: "Baccarat Squeeze", provider: "Evolution Gaming", category: "live", thumbnail_url: null, active: true, display_order: 14, demo_available: false, rtp: 98.76 },
  { id: "g15", game_key: "monopoly-live", title: "Monopoly Live", provider: "Evolution Gaming", category: "live", thumbnail_url: null, active: true, display_order: 15, demo_available: false, rtp: 96.23 },
  { id: "g16", game_key: "andar-bahar", title: "Andar Bahar", provider: "Ezugi", category: "live", thumbnail_url: null, active: true, display_order: 16, demo_available: false, rtp: 97.5 },
  { id: "g17", game_key: "aviator", title: "Aviator", provider: "Spribe", category: "crash", thumbnail_url: null, active: true, display_order: 17, demo_available: true, rtp: 97 },
  { id: "g18", game_key: "jetx", title: "JetX", provider: "Smartsoft", category: "crash", thumbnail_url: null, active: true, display_order: 18, demo_available: true, rtp: 96 },
  { id: "g19", game_key: "spaceman", title: "Spaceman", provider: "Pragmatic Play", category: "crash", thumbnail_url: null, active: true, display_order: 19, demo_available: true, rtp: 96.5 },
  { id: "g20", game_key: "plinko-x", title: "Plinko X", provider: "Smartsoft", category: "virtuals", thumbnail_url: null, active: true, display_order: 20, demo_available: true, rtp: 97 },
  { id: "g21", game_key: "mines", title: "Mines", provider: "Spribe", category: "virtuals", thumbnail_url: null, active: true, display_order: 21, demo_available: true, rtp: 97 },
];

export const MOCK_BANNERS: Banner[] = [
  {
    id: "b1",
    kind: "hero_slide",
    accent: "primary",
    title: "100% Welcome Bonus",
    description: "Double your first deposit up to $100 and start spinning.",
    eyebrow: "New Player Offer",
    cta_label: "Claim Bonus",
    cta_href: "/promotions",
    image_url: null,
    active: true,
    display_order: 1,
    starts_at: "2026-01-01T00:00:00Z",
    ends_at: null,
    created_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "b2",
    kind: "hero_slide",
    accent: "boost",
    title: "Aviator is Taking Off",
    description: "Cash out anytime before the plane flies away. Play now.",
    eyebrow: "Crash Game",
    cta_label: "Play Aviator",
    cta_href: "/casino/aviator",
    image_url: null,
    active: true,
    display_order: 2,
    starts_at: "2026-01-01T00:00:00Z",
    ends_at: null,
    created_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "b3",
    kind: "hero_slide",
    accent: "info",
    title: "Live Casino Weekend",
    description: "10% cashback on all live dealer losses, every weekend.",
    eyebrow: "Live Casino",
    cta_label: "Explore Live Casino",
    cta_href: "/live-casino",
    image_url: null,
    active: true,
    display_order: 3,
    starts_at: "2026-01-01T00:00:00Z",
    ends_at: null,
    created_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

export const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: "p1",
    type: "welcome_bonus",
    title: "100% Casino Welcome Bonus",
    description: "Get a 100% match bonus up to $100 on your first deposit.",
    banner_url: null,
    value: 100,
    wagering_requirement: 30,
    min_odds: null,
    min_selections: null,
    starts_at: "2026-01-01T00:00:00Z",
    ends_at: null,
    terms: "Wagering requirement 30x. Valid on slots only.",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "p2",
    type: "deposit_bonus",
    title: "Weekly Reload Bonus",
    description: "Top up any weekday and get 50% extra on your deposit.",
    banner_url: null,
    value: 50,
    wagering_requirement: 20,
    min_odds: null,
    min_selections: null,
    starts_at: "2026-01-01T00:00:00Z",
    ends_at: null,
    terms: "Maximum bonus $50 per week.",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "p3",
    type: "cashback",
    title: "Cashback Monday",
    description: "10% cashback on net losses from the weekend, credited every Monday.",
    banner_url: null,
    value: 10,
    wagering_requirement: 5,
    min_odds: null,
    min_selections: null,
    starts_at: "2026-01-01T00:00:00Z",
    ends_at: null,
    terms: "Applies to real-money play only.",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "p4",
    type: "free_bet",
    title: "Free Spins Friday",
    description: "50 free spins on selected slots every Friday.",
    banner_url: null,
    value: 0,
    wagering_requirement: 15,
    min_odds: null,
    min_selections: null,
    starts_at: "2026-01-01T00:00:00Z",
    ends_at: null,
    terms: "Free spins credited by 6pm CAT.",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
];

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: "t1", wallet_id: MOCK_WALLET.id, user_id: MOCK_USER_ID, type: "deposit", amount: 100, balance_before: 225.5, balance_after: 325.5, status: "completed", description: "EcoCash deposit", reference_id: "dep-1", reference_type: "deposit", created_by: null, created_at: "2026-08-03T08:00:00Z" },
  { id: "t2", wallet_id: MOCK_WALLET.id, user_id: MOCK_USER_ID, type: "bet_payout", amount: 45.4, balance_before: 180.1, balance_after: 225.5, status: "completed", description: "Aviator cashout", reference_id: "bet-1", reference_type: "casino_aggregator_win", created_by: null, created_at: "2026-08-02T21:14:00Z" },
  { id: "t3", wallet_id: MOCK_WALLET.id, user_id: MOCK_USER_ID, type: "bet_stake", amount: -10, balance_before: 190.1, balance_after: 180.1, status: "completed", description: "Aviator bet", reference_id: "bet-1", reference_type: "casino_aggregator_bet", created_by: null, created_at: "2026-08-02T21:13:00Z" },
  { id: "t4", wallet_id: MOCK_WALLET.id, user_id: MOCK_USER_ID, type: "gift_received", amount: 20, balance_before: 170.1, balance_after: 190.1, status: "completed", description: "Red packet received", reference_id: "thread-1", reference_type: "red_packet", created_by: null, created_at: "2026-08-01T18:45:00Z" },
  { id: "t5", wallet_id: MOCK_WALLET.id, user_id: MOCK_USER_ID, type: "withdrawal", amount: -50, balance_before: 220.1, balance_after: 170.1, status: "completed", description: "EcoCash withdrawal", reference_id: "wd-1", reference_type: "withdrawal", created_by: null, created_at: "2026-07-30T12:00:00Z" },
];

export const MOCK_ADMIN_STATS = {
  total_users: 12540,
  active_users: 8420,
  total_deposits: 542330,
  total_withdrawals: 372210,
  pending_withdrawals: 2,
};

export const MOCK_ADMIN_ACTIVITY = [
  { kind: "new_user", label: "John Dziva", amount: null, created_at: "2026-08-03T07:20:00Z" },
  { kind: "withdrawal", label: "Rutendo Chuma", amount: 250, created_at: "2026-08-03T06:45:00Z" },
  { kind: "deposit", label: "Blessing Ncube", amount: 100, created_at: "2026-08-03T06:30:00Z" },
  { kind: "deposit", label: "Farai Mutasa", amount: 20, created_at: "2026-08-02T22:10:00Z" },
  { kind: "withdrawal", label: "Tafadzwa Moyo", amount: 80, created_at: "2026-08-02T20:05:00Z" },
];

export const MOCK_PENDING_WITHDRAWALS = [
  { id: "pw1", user_id: "u2", full_name: "Rutendo Chuma", amount: 250, method: "ecocash" as const, destination: { phone: "+263771234567" }, requested_at: "2026-08-03T06:45:00Z" },
  { id: "pw2", user_id: "u3", full_name: "Kudakwashe Sibanda", amount: 120, method: "bank_transfer" as const, destination: { phone: "+263772345678" }, requested_at: "2026-08-03T05:30:00Z" },
];

export const MOCK_FUND_VIOLATIONS = [
  { id: "fv1", user_id: "u4", full_name: "Tapiwa Gumbo", kind: "withdrawal", attempted_amount: 200, available_profit_balance: 40, deposited_balance_at_attempt: 160, created_at: "2026-08-02T14:20:00Z" },
  { id: "fv2", user_id: "u5", full_name: "Nyasha Chikwanha", kind: "red_packet", attempted_amount: 30, available_profit_balance: 5, deposited_balance_at_attempt: 25, created_at: "2026-08-01T11:05:00Z" },
];

export const MOCK_AFFILIATE_STATS = {
  referral_code: MOCK_PROFILE.referral_code,
  total_referrals: 128,
  active_players: 86,
  total_commission: 642.3,
  pending_commission: 78.5,
};

export const MOCK_REFERRALS = [
  { id: "r1", full_name: "PlayerOne", created_at: "2026-05-20T00:00:00Z", status: "active" as const, commission: 15.2 },
  { id: "r2", full_name: "LuckyBetter", created_at: "2026-05-19T00:00:00Z", status: "active" as const, commission: 12.3 },
  { id: "r3", full_name: "BigWinKing", created_at: "2026-05-18T00:00:00Z", status: "suspended" as const, commission: 8.5 },
];

export const MOCK_SUPER_ADMIN_STATS = {
  total_users: 125430,
  total_operators: 24,
  total_deposits: 1542330,
  total_withdrawals: 900120,
  platform_profit: 642210,
};

export const MOCK_DEPOSITS_SERIES = Array.from({ length: 14 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (13 - i));
  const deposits = 8000 + Math.round(Math.sin(i / 2) * 3000 + i * 400);
  const withdrawals = 5000 + Math.round(Math.cos(i / 2) * 2000 + i * 250);
  return { day: date.toISOString().slice(0, 10), deposits, withdrawals };
});

export const MOCK_TOP_GAMES = [
  { game_key: "aviator", title: "Aviator", turnover: 42000 },
  { game_key: "sweet-bonanza", title: "Sweet Bonanza", turnover: 31000 },
  { game_key: "crazy-time", title: "Crazy Time", turnover: 26500 },
  { game_key: "gates-of-olympus", title: "Gates of Olympus", turnover: 19800 },
  { game_key: "jetx", title: "JetX", turnover: 14200 },
];

export const MOCK_BET_HISTORY = [
  { id: "h1", kind: "Sportsbook" as const, label: "Multiple Bet", stake: 10, result: 34.6, status: "won" as const, placedAt: "2026-08-03T07:10:00Z" },
  { id: "h2", kind: "Crash" as const, label: "Aviator", stake: 5, result: 12.4, status: "won" as const, placedAt: "2026-08-02T21:13:00Z" },
  { id: "h3", kind: "Sportsbook" as const, label: "Single Bet", stake: 20, result: 20, status: "lost" as const, placedAt: "2026-08-02T18:00:00Z" },
  { id: "h4", kind: "Crash" as const, label: "JetX", stake: 8, result: 8, status: "lost" as const, placedAt: "2026-08-01T20:22:00Z" },
  { id: "h5", kind: "Sportsbook" as const, label: "System Bet", stake: 15, result: 45, status: "won" as const, placedAt: "2026-07-31T15:40:00Z" },
];

export const MOCK_OTHER_USER_ID = "00000000-0000-0000-0000-000000000002";
export const MOCK_OTHER_USER_NAME = "Rutendo Chuma";

export const MOCK_THREAD_ID = "20000000-0000-0000-0000-000000000001";

// Small directory used by the mock chat "search for a player" flow.
export const MOCK_USER_DIRECTORY = [
  { id: MOCK_OTHER_USER_ID, full_name: MOCK_OTHER_USER_NAME, avatar_url: null as string | null },
  { id: "00000000-0000-0000-0000-000000000003", full_name: "Kudakwashe Sibanda", avatar_url: null },
  { id: "00000000-0000-0000-0000-000000000004", full_name: "Tapiwa Gumbo", avatar_url: null },
  { id: "00000000-0000-0000-0000-000000000005", full_name: "Nyasha Chikwanha", avatar_url: null },
  { id: "00000000-0000-0000-0000-000000000006", full_name: "Blessing Ncube", avatar_url: null },
];
