// Closed palette. Keys must match the API and the migration CHECK (plan D17, C42).
export const BOARD_COLOR_OPTIONS = [
  { key: "navy", label: "Azul-marinho", hex: "#1d3355" },
  { key: "blue", label: "Azul", hex: "#2f6fb3" },
  { key: "green", label: "Verde", hex: "#2e8b67" },
  { key: "amber", label: "Âmbar", hex: "#d08c1f" },
  { key: "purple", label: "Roxo", hex: "#7c5cc4" },
] as const;

export type BoardColor = (typeof BOARD_COLOR_OPTIONS)[number]["key"];

export const BOARD_COLORS: readonly BoardColor[] = BOARD_COLOR_OPTIONS.map((option) => option.key);

export const DEFAULT_BOARD_COLOR: BoardColor = "navy";

export function isBoardColor(value: unknown): value is BoardColor {
  return typeof value === "string" && (BOARD_COLORS as readonly string[]).includes(value);
}

export function boardColorHex(color: BoardColor): string {
  return BOARD_COLOR_OPTIONS.find((option) => option.key === color)?.hex ?? BOARD_COLOR_OPTIONS[0].hex;
}

export function boardColorLabel(color: BoardColor): string {
  return BOARD_COLOR_OPTIONS.find((option) => option.key === color)?.label ?? BOARD_COLOR_OPTIONS[0].label;
}
