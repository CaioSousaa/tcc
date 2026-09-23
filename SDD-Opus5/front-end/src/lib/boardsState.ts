import type { ApiError } from "@/lib/api";
import type { BoardSummary } from "@/services/boardService";

// Pure updates of the listing state, always fed with data returned by the API (F15, C38).

/**
 * Replaces in place, so an edit never moves the card (CA24, RN09). Editing a board
 * never changes cards, so the overdue count computed with the viewer's today is kept (RF10 F140).
 */
export function replaceBoard(boards: BoardSummary[], updated: BoardSummary): BoardSummary[] {
  return boards.map((board) => (board.id === updated.id ? { ...updated, overdueCount: board.overdueCount } : board));
}

export function removeBoard(boards: BoardSummary[], boardId: string): BoardSummary[] {
  return boards.filter((board) => board.id !== boardId);
}

export function isBoardNotFound(error: ApiError): boolean {
  return error.code === "BOARD_NOT_FOUND";
}

/**
 * A board that no longer exists counts as deleted: the API answers 404 and the
 * user sees success (RN14, CB11, plan A26/C37).
 */
export function deleteOutcome(error: ApiError | null): "deleted" | "failed" {
  if (error === null || isBoardNotFound(error)) return "deleted";
  return "failed";
}
