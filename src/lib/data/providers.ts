// Real SoftGamings aggregator content providers (from the revenue-share catalogue).
// Used for the provider strip and as valid values for casino_games.provider once
// the aggregator's game list sync is wired up.
export const SLOT_PROVIDERS = [
  "Pragmatic Play",
  "Novomatic",
  "Hacksaw Gaming",
  "Nolimit City",
  "Yggdrasil",
  "Endorphina",
  "PG Soft",
  "Play'n GO",
] as const;

export const LIVE_PROVIDERS = ["Evolution Gaming", "Ezugi", "Pragmatic Live", "Asia Gaming", "TVBET"] as const;

export const CRASH_PROVIDERS = ["Spribe", "Smartsoft", "Turbogames", "Aviatrix"] as const;

export const ALL_PROVIDERS = [...new Set([...SLOT_PROVIDERS, ...LIVE_PROVIDERS, ...CRASH_PROVIDERS])];
