import type { ApiError } from "@/lib/api";
import { plural } from "@/lib/plural";
import type { BoardListItem } from "@/services/boardService";
import type { ListDeletionDecision } from "@/services/listService";

export type DeletionChoice = "move" | "cascade" | null;

export type DeletionDraft = { choice: DeletionChoice; targetListId: string | null };

type ListRef = Pick<BoardListItem, "id" | "name" | "position">;

function ordered<T extends ListRef>(lists: readonly T[]): T[] {
  return [...lists].sort((a, b) => a.position - b.position);
}

/** Every list of the board except the one being deleted, in board order (spec 2.3). */
export function targetOptions<T extends ListRef>(lists: readonly T[], listId: string): T[] {
  return ordered(lists).filter((list) => list.id !== listId);
}

/** The list right after the deleted one; the one right before if it is the last; null if alone (CA07–CA10). */
export function suggestedTarget(lists: readonly ListRef[], listId: string): string | null {
  const sorted = ordered(lists);
  const index = sorted.findIndex((list) => list.id === listId);
  if (index === -1) return null;
  return sorted[index + 1]?.id ?? sorted[index - 1]?.id ?? null;
}

/** Initial state of the decision dialog (spec 2.3). Nothing destructive is ever preselected. */
export function initialDecision(lists: readonly ListRef[], listId: string, locked: boolean): DeletionDraft {
  if (locked) return { choice: null, targetListId: null };
  const target = suggestedTarget(lists, listId);
  return target ? { choice: "move", targetListId: target } : { choice: null, targetListId: null };
}

export function canConfirm(draft: DeletionDraft, locked: boolean, hasTarget: boolean): boolean {
  if (locked || draft.choice === null) return false;
  if (draft.choice === "move") return hasTarget && draft.targetListId !== null;
  return true;
}

/** Decision sent to the API, with the count the user saw (RN08, C112). */
export function toDecision(draft: DeletionDraft, expectedCardCount: number): ListDeletionDecision | null {
  if (draft.choice === "cascade") return { strategy: "cascade", expectedCardCount };
  if (draft.choice === "move" && draft.targetListId) {
    return { strategy: "move", targetListId: draft.targetListId, expectedCardCount };
  }
  return null;
}

/**
 * Keeps the dialog coherent after the board is reloaded (F60): a destination
 * that no longer exists falls back to the suggestion.
 */
export function reconcileDecision(draft: DeletionDraft, lists: readonly ListRef[], listId: string, locked: boolean): DeletionDraft {
  if (locked) return { choice: null, targetListId: null };
  if (draft.choice !== "move") return draft;
  const stillThere = targetOptions(lists, listId).some((list) => list.id === draft.targetListId);
  if (stillThere) return draft;
  const target = suggestedTarget(lists, listId);
  return target ? { choice: "move", targetListId: target } : { choice: null, targetListId: null };
}

export type ListDeletionFailureAction = "close-and-reload" | "board-not-found" | "stay-and-reload" | "stay";

/** Table of RF05 plan F61. */
export function listDeletionFailureAction(error: ApiError): ListDeletionFailureAction {
  switch (error.code) {
    case "LIST_NOT_FOUND":
      return "close-and-reload";
    case "BOARD_NOT_FOUND":
      return "board-not-found";
    case "LIST_CARD_COUNT_CHANGED":
    case "LIST_DELETION_LOCKED":
    case "TARGET_LIST_NOT_FOUND":
      return "stay-and-reload";
    default:
      return "stay";
  }
}

export function deletionSummary(cardCount: number): string {
  return `Ela contém ${plural(cardCount, "card", "cards")}. Escolha o que deve acontecer com eles.`;
}

export function cascadeWarning(cardCount: number): string {
  return `Ação irreversível: ${plural(cardCount, "card", "cards")} e todo o seu conteúdo serão apagados.`;
}
