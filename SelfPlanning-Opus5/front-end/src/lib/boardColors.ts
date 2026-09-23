export const BOARD_COLORS = ["navy", "blue", "green", "amber", "purple"] as const;

export type BoardColor = (typeof BOARD_COLORS)[number];

export const DEFAULT_BOARD_COLOR: BoardColor = "navy";

export const BOARD_COLOR_HEX: Record<BoardColor, string> = {
  navy: "#1e3a5f",
  blue: "#2f6fb5",
  green: "#2e7d5b",
  amber: "#d89b1c",
  purple: "#8e5cd9",
};

export const BOARD_COLOR_LABEL: Record<BoardColor, string> = {
  navy: "Azul-marinho",
  blue: "Azul",
  green: "Verde",
  amber: "Âmbar",
  purple: "Roxo",
};
