import type { ApiError } from "@/lib/api";

export type CardOperation = "create" | "open" | "save" | "delete";

/**
 * Table of RF04 plan F48:
 * - `board-not-found`: show BoardNotFound;
 * - `close-and-reload`: close with the API message as notice and reload the board;
 * - `deleted`: treat as success, close and reload (RN15);
 * - `stay-and-reload`: keep the dialog with the message and reload the board so the list selector is current (CB17);
 * - `stay`: keep the form or dialog open with the message.
 */
export type CardFailureAction = "board-not-found" | "close-and-reload" | "deleted" | "stay-and-reload" | "stay";

export function cardFailureAction(operation: CardOperation, error: ApiError): CardFailureAction {
  if (error.code === "BOARD_NOT_FOUND") return "board-not-found";

  if (error.code === "CARD_NOT_FOUND") {
    if (operation === "delete") return "deleted";
    if (operation === "open" || operation === "save") return "close-and-reload";
  }

  if (error.code === "LIST_NOT_FOUND") {
    if (operation === "create") return "close-and-reload";
    if (operation === "save") return "stay-and-reload";
  }

  return "stay";
}

export function deleteCardTitle(title: string): string {
  return `Excluir o card "${title}"?`;
}

export function cardDialogEyebrow(listName: string): string {
  return `CARD · ${listName}`;
}
