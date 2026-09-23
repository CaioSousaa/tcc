import { BoardList } from "./entities/BoardList";

export interface BoardListView {
  id: string;
  name: string;
  position: number;
  boardId: string;
  cardCount: number;
}

export function toBoardListView(list: BoardList, cardCount: number): BoardListView {
  return {
    id: list.id,
    name: list.name,
    position: list.position,
    boardId: list.boardId,
    cardCount,
  };
}
