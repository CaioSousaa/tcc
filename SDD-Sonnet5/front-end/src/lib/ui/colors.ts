import { LabelColor } from "@/lib/labels/api";

export const LABEL_COLOR_HEX: Record<LabelColor, string> = {
  verde: "#16a34a",
  amarelo: "#ca8a04",
  laranja: "#ea580c",
  vermelho: "#dc2626",
  roxo: "#9333ea",
  azul: "#2563eb",
  ciano: "#0891b2",
  cinza: "#52525b",
};

const AVATAR_PALETTE = [
  "#1d4ed8",
  "#7c3aed",
  "#0d9488",
  "#c2410c",
  "#be123c",
  "#4d7c0f",
  "#0369a1",
  "#a16207",
];

const BOARD_ACCENT_PALETTE = ["#1e2a47", "#0d9488", "#7c3aed", "#c2410c", "#0369a1", "#be123c"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function colorForId(id: string, palette: string[] = AVATAR_PALETTE): string {
  return palette[hashString(id) % palette.length];
}

export function boardAccentColor(id: string): string {
  return colorForId(id, BOARD_ACCENT_PALETTE);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
