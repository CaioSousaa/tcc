import { BoardColor } from "./boards";

export const BOARD_COLOR_CLASSES: Record<BoardColor, string> = {
  navy: "bg-slate-800",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  gold: "bg-amber-500",
  purple: "bg-purple-500",
};

export const BOARD_COLOR_BORDER_CLASSES: Record<BoardColor, string> = {
  navy: "border-t-slate-800",
  blue: "border-t-blue-500",
  green: "border-t-emerald-500",
  gold: "border-t-amber-500",
  purple: "border-t-purple-500",
};

export const BOARD_COLOR_LABELS: Record<BoardColor, string> = {
  navy: "Azul-marinho",
  blue: "Azul",
  green: "Verde",
  gold: "Dourado",
  purple: "Roxo",
};
