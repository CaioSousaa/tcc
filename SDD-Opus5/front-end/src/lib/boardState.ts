import type { BoardDetail, BoardListItem } from "@/services/boardService";

/**
 * Replaces the lists returned by the API, matched by id, keeping the others as
 * they are (RF04 F47, CB21). Never computes a move locally.
 */
export function replaceLists(board: BoardDetail, affected: readonly BoardListItem[]): BoardDetail {
  const byId = new Map(affected.map((list) => [list.id, list]));
  const lists = board.lists.map((list) => byId.get(list.id) ?? list);
  const cardCount = lists.reduce((total, list) => total + list.cardCount, 0);
  return { ...board, lists, cardCount };
}

/** The whole saved order of the board replaces the page state (RF03 F28). */
export function withLists(board: BoardDetail, lists: BoardListItem[]): BoardDetail {
  const cardCount = lists.reduce((total, list) => total + list.cardCount, 0);
  return { ...board, lists, listCount: lists.length, cardCount };
}
