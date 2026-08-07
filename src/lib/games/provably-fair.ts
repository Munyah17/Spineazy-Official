// Isomorphic provably-fair primitives (Web Crypto works the same in Node
// API routes and in the browser, so this file has zero server/client
// branching). Used by both the real demo API routes and the mock store's
// client-side simulation of the same algorithm.

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomHex(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

export async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return toHex(digest);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(signature);
}

/** A 0.00-99.99 roll derived from HMAC(serverSeed, "clientSeed:nonce"). */
export async function computeRoll(serverSeed: string, clientSeed: string, nonce: number): Promise<number> {
  const hex = await hmacSha256Hex(serverSeed, `${clientSeed}:${nonce}`);
  const intVal = parseInt(hex.slice(0, 8), 16);
  const scaled = Math.floor((intVal / 0x100000000) * 10000);
  return Math.min(scaled, 9999) / 100;
}

export const DICE_HOUSE_EDGE = 0.01;
export const DICE_MIN_TARGET = 2;
export const DICE_MAX_TARGET = 98;

export type DiceDirection = "under" | "over";

export function diceWinChance(target: number, direction: DiceDirection): number {
  return direction === "under" ? target : 100 - target;
}

export function diceMultiplier(target: number, direction: DiceDirection): number {
  const winChance = diceWinChance(target, direction);
  return Math.max(1.01, (100 / winChance) * (1 - DICE_HOUSE_EDGE));
}

export function isDiceWin(roll: number, target: number, direction: DiceDirection): boolean {
  return direction === "under" ? roll < target : roll > target;
}
