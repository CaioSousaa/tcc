export const BOARD_COLORS = ["slate", "blue", "green", "amber", "purple"] as const;
export type BoardColor = (typeof BOARD_COLORS)[number];

export const BOARD_COLOR_CLASSES: Record<BoardColor, string> = {
  slate: "bg-[#1c3557]",
  blue: "bg-[#2f6fb3]",
  green: "bg-[#2c8a6b]",
  amber: "bg-[#c98a1e]",
  purple: "bg-[#7a5bb5]",
};

export interface Board {
  id: string;
  name: string;
  color: BoardColor;
  createdAt: string;
  updatedAt: string;
}

export interface BoardSummary {
  listCount: number;
  cardCount: number;
  overdueCount: number;
  role: "admin" | "member";
  members: { id: string; name: string }[];
}
