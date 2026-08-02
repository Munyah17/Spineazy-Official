// SoftGamings casino content aggregator client.
//
// STATUS: scaffold only. SoftGamings' commercial proposal (revenue-share
// catalogue, 200+ providers, single API) is confirmed, but the technical
// integration guide -- exact launch endpoint, request/response fields, and
// the seamless-wallet callback contract (debit/credit/rollback signature
// scheme) -- has not been provided yet. The shape below follows the
// standard aggregator "seamless wallet" pattern used across the industry;
// verify every field name and the signing method against SoftGamings' own
// docs before relying on this in production.

export class SoftGamingsNotConfiguredError extends Error {
  constructor() {
    super("SoftGamings API credentials are not configured (SOFTGAMINGS_API_BASE_URL / SOFTGAMINGS_API_KEY).");
    this.name = "SoftGamingsNotConfiguredError";
  }
}

function getConfig() {
  const baseUrl = process.env.SOFTGAMINGS_API_BASE_URL;
  const apiKey = process.env.SOFTGAMINGS_API_KEY;
  if (!baseUrl || !apiKey) throw new SoftGamingsNotConfiguredError();
  return { baseUrl, apiKey };
}

export async function launchGame(params: {
  gameKey: string;
  playerId: string;
  currency: string;
  mode: "real" | "demo";
  languageCode?: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const { baseUrl, apiKey } = getConfig();

  // TODO(softgamings-integration): confirm the real endpoint path, payload
  // field names, and auth header against the SoftGamings technical guide.
  const res = await fetch(`${baseUrl}/games/launch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      gameId: params.gameKey,
      playerId: params.playerId,
      currency: params.currency,
      mode: params.mode,
      lang: params.languageCode ?? "en",
      returnUrl: params.returnUrl,
    }),
  });

  if (!res.ok) {
    throw new Error(`SoftGamings launch failed (${res.status}): ${await res.text().catch(() => "")}`);
  }

  const data = (await res.json()) as { url?: string; gameUrl?: string };
  const url = data.url ?? data.gameUrl;
  if (!url) throw new Error("SoftGamings launch response did not include a game URL");
  return { url };
}
