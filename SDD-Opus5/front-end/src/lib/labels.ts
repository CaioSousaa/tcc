import type { ApiError } from "@/lib/api";
import type { BoardDetail, BoardListItem, CardSummary } from "@/services/boardService";
import type { LabelView } from "@/services/labelService";
import { MESSAGES } from "./messages";
import { plural } from "./plural";

/** Selected label ids of the filter; empty means "Todas" (RF08 RN08, F107). */
export type LabelSelection = ReadonlySet<string>;

export const NO_SELECTION: LabelSelection = new Set<string>();

/** Selects an unselected label and unselects a selected one (spec 2.7). */
export function toggleSelection(selection: LabelSelection, labelId: string): LabelSelection {
  const next = new Set(selection);
  if (next.has(labelId)) next.delete(labelId);
  else next.add(labelId);
  return next;
}

/** Keeps only labels that still exist; the same object when nothing changed (C202, CA33, CB16). */
export function pruneSelection(selection: LabelSelection, labels: readonly Pick<LabelView, "id">[]): LabelSelection {
  if (selection.size === 0) return selection;
  const existing = new Set(labels.map((label) => label.id));
  const next = new Set([...selection].filter((id) => existing.has(id)));
  return next.size === selection.size ? selection : next;
}

/** RN08: with no selection every card matches; otherwise at least one selected label. */
export function cardMatches(card: Pick<CardSummary, "labelIds">, selection: LabelSelection): boolean {
  if (selection.size === 0) return true;
  return card.labelIds.some((id) => selection.has(id));
}

/**
 * Display projection of F108: every list in order, only matching cards in their
 * order, and `cardCount` equal to the cards shown. Only `BoardLists` may receive it (F109).
 */
export function filterLists(lists: readonly BoardListItem[], selection: LabelSelection): BoardListItem[] {
  if (selection.size === 0) return [...lists];
  return lists.map((list) => {
    const cards = list.cards.filter((card) => cardMatches(card, selection));
    return { ...list, cards, cardCount: cards.length };
  });
}

export function countCards(lists: readonly Pick<BoardListItem, "cards">[]): number {
  return lists.reduce((total, list) => total + list.cards.length, 0);
}

/** "{N} cards no quadro" without filter, "{X} de {N} cards" with filter (spec 2.8). */
export function visibleTotalLabel(visible: number, total: number, filtered: boolean): string {
  if (!filtered) return `${plural(total, "card", "cards")} no quadro`;
  return `${visible} de ${plural(total, "card", "cards")}`;
}

/** Labels of a card in label order; ids without label are ignored (F111). */
export function resolveLabels(labelIds: readonly string[], labels: readonly LabelView[]): LabelView[] {
  const applied = new Set(labelIds);
  return labels.filter((label) => applied.has(label.id));
}

/** Names, colors and usage after any label write (F110). */
export function withLabels(board: BoardDetail, labels: LabelView[]): BoardDetail {
  return { ...board, labels };
}

/** The face shows the saved labels of the card (F110). Nothing else changes. */
export function withCardLabels(board: BoardDetail, cardId: string, labelIds: string[]): BoardDetail {
  let changed = false;
  const lists = board.lists.map((list) => {
    if (!list.cards.some((card) => card.id === cardId)) return list;
    changed = true;
    return { ...list, cards: list.cards.map((card) => (card.id === cardId ? { ...card, labelIds } : card)) };
  });
  return changed ? { ...board, lists } : board;
}

/** A deleted label leaves every card (RN10, F110). */
export function withoutLabel(board: BoardDetail, labelId: string): BoardDetail {
  const lists = board.lists.map((list) =>
    list.cards.some((card) => card.labelIds.includes(labelId))
      ? { ...list, cards: list.cards.map((card) => ({ ...card, labelIds: card.labelIds.filter((id) => id !== labelId) })) }
      : list,
  );
  return { ...board, labels: board.labels.filter((label) => label.id !== labelId), lists };
}

export function deleteLabelTitle(name: string): string {
  return `Excluir a etiqueta "${name}"?`;
}

/** Confirmation text of spec 2.5. */
export function deleteLabelBody(usage: number): string {
  if (usage <= 0) return MESSAGES.unusedLabel;
  return `Ela será removida de ${plural(usage, "card", "cards")}. Os cards não serão excluídos.`;
}

export type LabelOperation = "create" | "update" | "delete" | "apply" | "unapply";

/**
 * Table of RF08 plan F112:
 * - `board-not-found`: the board page shows "Quadro não encontrado.";
 * - `forbidden`: close the window, notice on the board and reload it (CB14);
 * - `card-gone`: close the card windows and reload the board (CB13);
 * - `done-and-reload`: already gone; reload labels as success (CB12);
 * - `reload-with-message`: message in the window and reload labels (CA37);
 * - `show-in-field`: message next to "Nome" (A63);
 * - `show-in-form`: message next to the form, values kept (CE01);
 * - `show-in-window`: message in the window, checkboxes as saved (CE02);
 * - `show-in-confirmation`: message in the confirmation (CE03).
 */
export type LabelFailureAction =
  | "board-not-found"
  | "forbidden"
  | "card-gone"
  | "done-and-reload"
  | "reload-with-message"
  | "show-in-field"
  | "show-in-form"
  | "show-in-window"
  | "show-in-confirmation";

const FIELD_CODES: readonly string[] = ["VALIDATION_ERROR", "LABEL_NAME_TAKEN", "LABEL_LIMIT_REACHED"];

export function labelFailureAction(operation: LabelOperation, error: ApiError): LabelFailureAction {
  if (error.code === "BOARD_NOT_FOUND") return "board-not-found";
  if (error.code === "FORBIDDEN") return "forbidden";
  if (error.code === "CARD_NOT_FOUND" && (operation === "apply" || operation === "unapply")) return "card-gone";
  if (error.code === "LABEL_NOT_FOUND") {
    return operation === "delete" || operation === "unapply" ? "done-and-reload" : "reload-with-message";
  }
  if (operation === "create" || operation === "update") {
    return FIELD_CODES.includes(error.code) ? "show-in-field" : "show-in-form";
  }
  if (operation === "delete") return "show-in-confirmation";
  return "show-in-window";
}
