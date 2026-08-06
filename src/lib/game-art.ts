const GRADIENT_PAIRS = [
  ["#a855f7", "#3b0764"],
  ["#22c55e", "#052e16"],
  ["#facc15", "#451a03"],
  ["#4ea8ff", "#082140"],
  ["#ff4d5e", "#450a0a"],
  ["#f472b6", "#4a044e"],
  ["#a855f7", "#082140"],
  ["#22c55e", "#3b0764"],
] as const;

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// A layered mesh (soft top-left highlight + base diagonal wash) reads as
// deliberate art direction rather than a single flat color swatch.
export function gameArtGradient(seed: string) {
  const hash = hashString(seed);
  const [from, to] = GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
  const angle = 120 + (hash % 60);
  return [
    `radial-gradient(120% 90% at 15% 0%, ${from}55, transparent 60%)`,
    `linear-gradient(${angle}deg, ${from}, ${to})`,
  ].join(", ");
}

export function gameArtRotation(seed: string) {
  return (hashString(seed) % 24) - 12;
}
