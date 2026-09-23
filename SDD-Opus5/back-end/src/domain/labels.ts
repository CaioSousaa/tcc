import { characterCount, normalizeCardTitle } from "./cards";

/** Closed palette, in display order (RF08 spec "Paleta", plan D37). Keys match the migration CHECK. */
export const LABEL_COLORS = ["red", "blue", "green", "amber", "purple", "gray"] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export const LABEL_NAME_MAX = 30;
export const LABELS_MAX = 50;

export type LabelView = {
  id: string;
  name: string;
  color: LabelColor;
  /** Cards of the board with this label; always aggregated, never stored (D40). */
  usage: number;
};

export function isLabelColor(value: unknown): value is LabelColor {
  return typeof value === "string" && (LABEL_COLORS as readonly string[]).includes(value);
}

/** Line breaks become spaces, then the ends are trimmed; inner spaces are kept (RN03). */
export function normalizeLabelName(value: string): string {
  return normalizeCardTitle(value);
}

/** Comparison key of RN04: normalized and case-insensitive, accents preserved (F105). */
export function labelNameKey(value: string): string {
  return normalizeLabelName(value).toLowerCase();
}

export { characterCount };
