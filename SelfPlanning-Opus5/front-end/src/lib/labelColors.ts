export const LABEL_COLORS = ["red", "blue", "green", "amber", "purple", "gray"] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export const DEFAULT_LABEL_COLOR: LabelColor = "red";

export const LABEL_COLOR_HEX: Record<LabelColor, string> = {
  red: "#c0392b",
  blue: "#2f6fb5",
  green: "#2e7d5b",
  amber: "#d89b1c",
  purple: "#8e5cd9",
  gray: "#64748b",
};

export const LABEL_COLOR_LABEL: Record<LabelColor, string> = {
  red: "Vermelho",
  blue: "Azul",
  green: "Verde",
  amber: "Âmbar",
  purple: "Roxo",
  gray: "Cinza",
};
