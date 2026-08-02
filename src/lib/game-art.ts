const GRADIENT_PAIRS = [
  ["#a855f7", "#4c1d95"],
  ["#22c55e", "#14532d"],
  ["#facc15", "#78350f"],
  ["#4ea8ff", "#0c2a52"],
  ["#ff4d5e", "#5c0a13"],
  ["#f472b6", "#5b1244"],
] as const;

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function gameArtGradient(seed: string) {
  const [from, to] = GRADIENT_PAIRS[hashString(seed) % GRADIENT_PAIRS.length];
  return `linear-gradient(155deg, ${from}, ${to})`;
}
