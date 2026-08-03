// MOCK LAYER — delete `src/lib/mock/` and every `if (USE_MOCK_DATA)` branch
// that imports from it once the real Supabase project, SoftGamings
// aggregator, and payment/chat backends are wired up. Flip this to `false`
// first to verify nothing depends on it before deleting.
export const USE_MOCK_DATA = true;
