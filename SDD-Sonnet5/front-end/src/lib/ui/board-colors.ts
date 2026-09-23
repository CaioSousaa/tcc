import { boardAccentColor } from "@/lib/ui/colors";

const STORAGE_KEY = "kanbo:board-colors";

export const BOARD_COLOR_OPTIONS = [
  "#1e2a47",
  "#2563eb",
  "#16a34a",
  "#ca8a04",
  "#7c3aed",
] as const;

function readOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getBoardColor(boardId: string): string {
  const overrides = readOverrides();
  return overrides[boardId] ?? boardAccentColor(boardId);
}

export function setBoardColor(boardId: string, color: string): void {
  if (typeof window === "undefined") return;
  const overrides = readOverrides();
  overrides[boardId] = color;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}
