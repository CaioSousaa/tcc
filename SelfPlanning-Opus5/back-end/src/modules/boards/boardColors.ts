export const BOARD_COLORS = ["navy", "blue", "green", "amber", "purple"] as const;

export type BoardColor = (typeof BOARD_COLORS)[number];

export const DEFAULT_BOARD_COLOR: BoardColor = "navy";

export function isBoardColor(value: unknown): value is BoardColor {
  return typeof value === "string" && BOARD_COLORS.includes(value as BoardColor);
}
