import type { ChecklistItem } from "./checklist";
import type { CommentView } from "./comments";
import type { ListItem } from "./lists";
import type { AssigneeRef } from "./members";

export const CARD_TITLE_MAX = 200;
export const CARD_DESCRIPTION_MAX = 5000;

/** Face of a card. Checklist counts are aggregated from the items, never stored (RF06 F68). */
export type CardSummary = {
  id: string;
  title: string;
  position: number;
  checklistTotal: number;
  checklistDone: number;
  /** Assignees in order of assignment, resolved by the interface from the board members (RF07 F94). */
  assigneeIds: string[];
  /** Labels in label order, resolved by the interface from the board labels (RF08 F111). */
  labelIds: string[];
  /** Existing comments, aggregated and never stored (RF09 D46). */
  commentCount: number;
  /** `YYYY-MM-DD` or `null`; the status is computed on the device (RF10 F138). */
  dueDate: string | null;
};

export type CardDetail = {
  id: string;
  title: string;
  description: string | null;
  listId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  /** Items of the card, in order of addition (RF06 C130). */
  checklist: ChecklistItem[];
  /** Assignees in order of assignment (RF07 RN13). */
  assignees: AssigneeRef[];
  /** Labels in label order (RF08 RN11). */
  labelIds: string[];
  /** History in publication order (RF09 RN04). */
  comments: CommentView[];
  dueDate: string | null;
};

/** A list with its cards in order; `cardCount` always equals `cards.length` (RN17). */
export type ListWithCards = ListItem & { cards: CardSummary[] };

/** Unicode code points, matching char_length() in PostgreSQL (D24). */
export function characterCount(value: string): number {
  return Array.from(value).length;
}

// CRLF first so a Windows line break becomes a single space; U+2028/U+2029 are Unicode line/paragraph separators.
const TITLE_LINE_BREAKS = new RegExp(["\\r\\n", "\\r", "\\n", "\\u" + "2028", "\\u" + "2029"].join("|"), "g");

/** Each line break becomes one space, then the ends are trimmed (D26, RN03). */
export function normalizeCardTitle(value: string): string {
  return value.replace(TITLE_LINE_BREAKS, " ").trim();
}

/** CRLF/CR become LF and the ends are trimmed; empty means "no description" (D21, D25, RN04). */
export function normalizeDescription(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  return normalized.length === 0 ? null : normalized;
}
