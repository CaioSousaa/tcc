// Closed palette of RF08. Keys must match the API and the migration CHECK (plan D37, C181).
// Text over background keeps a contrast of at least 4.5:1 (N175).
export const LABEL_COLOR_OPTIONS = [
  { key: "red", label: "Vermelho", swatch: "#d64545", background: "#fde8e8", text: "#9b1c1c" },
  { key: "blue", label: "Azul", swatch: "#2f6fb3", background: "#e3eefa", text: "#1e4f86" },
  { key: "green", label: "Verde", swatch: "#2e8b67", background: "#e0f2ea", text: "#1d5c43" },
  { key: "amber", label: "Âmbar", swatch: "#d08c1f", background: "#fcf0dc", text: "#7a4e0a" },
  { key: "purple", label: "Roxo", swatch: "#7c5cc4", background: "#eee8fa", text: "#553a99" },
  { key: "gray", label: "Cinza", swatch: "#6b7280", background: "#eceef1", text: "#3f4550" },
] as const;

export type LabelColor = (typeof LABEL_COLOR_OPTIONS)[number]["key"];
export type LabelColorOption = (typeof LABEL_COLOR_OPTIONS)[number];

export const LABEL_COLORS: readonly LabelColor[] = LABEL_COLOR_OPTIONS.map((option) => option.key);

/** Pre-selected in "Nova etiqueta" (spec 2.4). */
export const DEFAULT_LABEL_COLOR: LabelColor = "red";

export function isLabelColor(value: unknown): value is LabelColor {
  return typeof value === "string" && (LABEL_COLORS as readonly string[]).includes(value);
}

/** Styles only ever come from this closed map, never from API values (N167). Unknown keys fall back to gray. */
export function labelColorOption(color: string): LabelColorOption {
  return LABEL_COLOR_OPTIONS.find((option) => option.key === color) ?? LABEL_COLOR_OPTIONS[5];
}
