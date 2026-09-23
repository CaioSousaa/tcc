import type { ApiError } from "@/lib/api";
import type { BoardDetail } from "@/services/boardService";
import type { CommentView } from "@/services/commentService";
import { can, type BoardRole } from "./permissions";
import { plural } from "./plural";

/** CR LF and lone CR become LF, then the ends are trimmed; inner whitespace is kept (RF09 2.4). */
export function normalizeCommentBody(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

/** Only the author edits, whatever the role (RN05, CA17). Hides controls only; the API decides (F127). */
export function canEditComment(comment: Pick<CommentView, "author">, currentUserId: string | undefined): boolean {
  return currentUserId !== undefined && comment.author.userId === currentUserId;
}

/** The author, or a role that moderates comments (RN05, CA21, CA22, CA26). */
export function canDeleteComment(
  comment: Pick<CommentView, "author">,
  currentUserId: string | undefined,
  myRole: BoardRole,
): boolean {
  return canEditComment(comment, currentUserId) || can(myRole, "comments.moderate");
}

/** Accessible name of the face indicator: "2 comentários" / "1 comentário" (spec 2.7). */
export function commentCountLabel(count: number): string {
  return plural(count, "comentário", "comentários");
}

/** The face shows the saved count right after publishing or deleting (F128). Nothing else changes. */
export function withCardCommentCount(board: BoardDetail, cardId: string, commentCount: number): BoardDetail {
  let changed = false;
  const lists = board.lists.map((list) => {
    if (!list.cards.some((card) => card.id === cardId)) return list;
    changed = true;
    return { ...list, cards: list.cards.map((card) => (card.id === cardId ? { ...card, commentCount } : card)) };
  });
  return changed ? { ...board, lists } : board;
}

export type CommentOperation = "create" | "update" | "delete";

/**
 * Table of RF09 plan F133:
 * - `board-not-found`: the board page shows "Quadro não encontrado." (CB15);
 * - `card-gone`: close the card dialog and reload the board (CA31);
 * - `forbidden`: message, reload the board (role) and the history (CB14);
 * - `done-and-reload`: already deleted; success and reload the history (CB11);
 * - `reload-with-message`: close the edit, message and reload the history (CA29);
 * - `show-in-field`: message next to the text, text kept (CA08, CA09, CA32, CE01, CE02);
 * - `show-in-confirmation`: message in the confirmation (CE03).
 */
export type CommentFailureAction =
  | "board-not-found"
  | "card-gone"
  | "forbidden"
  | "done-and-reload"
  | "reload-with-message"
  | "show-in-field"
  | "show-in-confirmation";

export function commentFailureAction(operation: CommentOperation, error: ApiError): CommentFailureAction {
  if (error.code === "BOARD_NOT_FOUND") return "board-not-found";
  if (error.code === "CARD_NOT_FOUND") return "card-gone";
  if (error.code === "FORBIDDEN") return "forbidden";
  if (error.code === "COMMENT_NOT_FOUND") return operation === "delete" ? "done-and-reload" : "reload-with-message";
  return operation === "delete" ? "show-in-confirmation" : "show-in-field";
}
