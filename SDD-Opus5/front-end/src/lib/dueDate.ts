import type { BoardListItem, CardSummary } from "@/services/boardService";
import { filterLists, type LabelSelection } from "./labels";

// Due dates are calendar dates as YYYY-MM-DD text; never a Date with time (RF10 T17, D49).
export const DUE_DATE_MIN = "2000-01-01";
export const DUE_DATE_MAX = "2099-12-31";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

type Parts = { year: number; month: number; day: number };

function parts(value: string): Parts | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Calendar date of the device, from local components (RN02, F143). */
export function localToday(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Existing calendar date between 2000-01-01 and 2099-12-31 (RN01, same rule as the API). */
export function isValidDueDate(value: string): boolean {
  return parts(value) !== null && value >= DUE_DATE_MIN && value <= DUE_DATE_MAX;
}

/** Calendar days from `today` to `due`: 0 today, 1 tomorrow, negative when past. Immune to DST (F143, CB10). */
export function daysUntil(due: string, today: string): number {
  const d = parts(due);
  const t = parts(today);
  if (!d || !t) return Number.NaN;
  return Math.round((Date.UTC(d.year, d.month - 1, d.day) - Date.UTC(t.year, t.month - 1, t.day)) / DAY_MS);
}

/** "3 set", or "5 jan 2027" when the year differs from today's (spec 2.3). */
export function formatDueShort(due: string, today: string): string {
  const d = parts(due);
  const t = parts(today);
  if (!d) return due;
  const text = `${d.day} ${MONTHS[d.month - 1]}`;
  return t && t.year === d.year ? text : `${text} ${d.year}`;
}

/** DD/MM/AAAA (RN09). */
export function formatDueField(due: string): string {
  const d = parts(due);
  return d ? `${pad(d.day)}/${pad(d.month)}/${d.year}` : due;
}

export type DueStatus =
  | { kind: "none" }
  | { kind: "overdue" | "soon" | "ok"; days: number; text: string };

/** Exactly the table of spec 2.3 and RN03 (F144). */
export function dueStatus(due: string | null, today: string): DueStatus {
  if (due === null) return { kind: "none" };
  const days = daysUntil(due, today);
  if (Number.isNaN(days)) return { kind: "none" };
  if (days < 0) {
    const late = Math.abs(days);
    return { kind: "overdue", days, text: `Atrasado há ${late} ${late === 1 ? "dia" : "dias"}` };
  }
  if (days === 0) return { kind: "soon", days, text: "Vence hoje" };
  if (days === 1) return { kind: "soon", days, text: "Vence amanhã" };
  const text = `Vence ${formatDueShort(due, today)}`;
  return days === 2 ? { kind: "soon", days, text } : { kind: "ok", days, text };
}

/** "Prazo: DD/MM/AAAA. {texto}." (spec 2.3, C259). */
export function dueAccessibleName(due: string, status: DueStatus): string {
  return status.kind === "none" ? `Prazo: ${formatDueField(due)}.` : `Prazo: ${formatDueField(due)}. ${status.text}.`;
}

/**
 * Stable order of RN06: due date ascending (text comparison), cards without due
 * date last, ties by position. Never mutates the input (F147).
 */
export function sortCardsByDueDate<T extends Pick<CardSummary, "dueDate" | "position">>(cards: readonly T[]): T[] {
  return [...cards].sort((a, b) => {
    if (a.dueDate !== b.dueDate) {
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    return a.position - b.position;
  });
}

/**
 * Display projection of the board: label filter first (RF08), then the due date
 * order inside each list. Counts stay the filtered ones. Only BoardLists may receive it (F141, F147).
 */
export function projectLists(lists: readonly BoardListItem[], selection: LabelSelection, sortByDue: boolean): BoardListItem[] {
  const filtered = filterLists(lists, selection);
  if (!sortByDue) return filtered;
  return filtered.map((list) => ({ ...list, cards: sortCardsByDueDate(list.cards) }));
}

/** Badge colors per status; text over background keeps a contrast of at least 4.5:1 (N211). */
export const DUE_BADGE_COLORS = {
  ok: { background: "#eceef1", text: "#3f4550" },
  soon: { background: "#fcf0dc", text: "#7a4e0a" },
  overdue: { background: "#fde8e8", text: "#9b1c1c" },
} as const;
