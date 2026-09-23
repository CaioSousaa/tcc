const PALETTE = [
  "#1e3a5f",
  "#8b5cf6",
  "#2e8b57",
  "#d9a32b",
  "#2f80c4",
  "#b42318",
];

/** Deterministic color per id, so the same person always gets the same avatar color. */
export function getAvatarColor(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return PALETTE[hash % PALETTE.length]!;
}
