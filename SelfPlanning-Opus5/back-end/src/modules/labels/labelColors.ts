export const LABEL_COLORS = ["red", "blue", "green", "amber", "purple", "gray"] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export function isLabelColor(value: unknown): value is LabelColor {
  return typeof value === "string" && LABEL_COLORS.includes(value as LabelColor);
}
