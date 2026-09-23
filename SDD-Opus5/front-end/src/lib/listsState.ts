import type { ApiError } from "@/lib/api";

export type ListOperation = "create" | "update" | "delete";

/**
 * What the board page does with a failed list operation (plan F30, F31, C58):
 * - `board-not-found`: the whole board is gone (CB17);
 * - `reload`: the list is already gone; treat as done and reload the board (RN15, CB15);
 * - `reload-with-notice`: close, warn "Lista não encontrada." and reload (CB14);
 * - `show-in-dialog`: keep the dialog open with the message (CE01, CE02).
 */
export type ListFailureAction = "board-not-found" | "reload" | "reload-with-notice" | "show-in-dialog";

export function listFailureAction(operation: ListOperation, error: ApiError): ListFailureAction {
  if (error.code === "BOARD_NOT_FOUND") return "board-not-found";
  if (error.code === "LIST_NOT_FOUND") return operation === "delete" ? "reload" : "reload-with-notice";
  return "show-in-dialog";
}

/** Empty lists use the simple RF03 confirmation; lists with cards open the RF05 decision dialog (C110). */
export function deletionDialogFor(list: { cardCount: number }): "simple" | "decision" {
  return list.cardCount === 0 ? "simple" : "decision";
}

export function deleteListTitle(name: string): string {
  return `Excluir a lista "${name}"?`;
}
