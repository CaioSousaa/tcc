export const LABEL_COLORS = ["red", "blue", "green", "amber", "purple", "gray"] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

export const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  red: "bg-[#c8443b]",
  blue: "bg-[#2f6fb3]",
  green: "bg-[#2c8a6b]",
  amber: "bg-[#c98a1e]",
  purple: "bg-[#7a5bb5]",
  gray: "bg-[#6b7683]",
};

export const LABEL_COLOR_CHIP_CLASSES: Record<LabelColor, string> = {
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-800",
  purple: "bg-purple-100 text-purple-700",
  gray: "bg-slate-200 text-slate-700",
};

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
  boardId: string;
  createdAt: string;
  cardCount?: number;
}
