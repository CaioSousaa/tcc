import type { ApiError } from "@/lib/api";
import type { BoardDetail } from "@/services/boardService";
import type { ChecklistItem } from "@/services/checklistService";

export type ChecklistProgress = { done: number; total: number; percent: number; complete: boolean };
export type ChecklistSummary = { done: number; total: number };

/** Rounded down, so 100% only when every item is done; no progress without items (RN09, C131). */
export function checklistProgress(done: number, total: number): ChecklistProgress | null {
  if (total <= 0) return null;
  return { done, total, percent: Math.floor((done * 100) / total), complete: done === total };
}

export function sectionLabel(progress: ChecklistProgress): string {
  return `${progress.done}/${progress.total} concluídos · ${progress.percent}%`;
}

export function faceLabel(progress: ChecklistProgress): string {
  return `${progress.done}/${progress.total}`;
}

export function faceAccessibleName(progress: ChecklistProgress): string {
  return `Checklist: ${progress.done} de ${progress.total} itens concluídos (${progress.percent}%)`;
}

export function summarize(items: readonly Pick<ChecklistItem, "done">[]): ChecklistSummary {
  return { done: items.filter((item) => item.done).length, total: items.length };
}

/** The card face shows the saved checklist right after an action (spec 2.6, C133). Nothing else changes. */
export function withCardChecklist(board: BoardDetail, cardId: string, summary: ChecklistSummary): BoardDetail {
  let changed = false;
  const lists = board.lists.map((list) => {
    if (!list.cards.some((card) => card.id === cardId)) return list;
    changed = true;
    return {
      ...list,
      cards: list.cards.map((card) =>
        card.id === cardId ? { ...card, checklistTotal: summary.total, checklistDone: summary.done } : card,
      ),
    };
  });
  return changed ? { ...board, lists } : board;
}

export type ChecklistOperation = "add" | "toggle" | "edit" | "remove";

/**
 * Table of RF06 plan F74:
 * - `card-gone`: board or card no longer exists; the board page handles it (CA38, CB21);
 * - `reload-with-message`: show "Item não encontrado." and reload the checklist (CA36);
 * - `reload-silently`: the item is already gone; reload without error (RN14);
 * - `show-in-field`: message next to the add or edit field;
 * - `show-in-section`: message at the top of the section (CE02).
 */
export type ChecklistFailureAction = "card-gone" | "reload-with-message" | "reload-silently" | "show-in-field" | "show-in-section";

export function checklistFailureAction(operation: ChecklistOperation, error: ApiError): ChecklistFailureAction {
  if (error.code === "BOARD_NOT_FOUND" || error.code === "CARD_NOT_FOUND") return "card-gone";
  if (error.code === "CHECKLIST_ITEM_NOT_FOUND") return operation === "remove" ? "reload-silently" : "reload-with-message";
  if (operation === "add" || operation === "edit") return "show-in-field";
  return "show-in-section";
}
