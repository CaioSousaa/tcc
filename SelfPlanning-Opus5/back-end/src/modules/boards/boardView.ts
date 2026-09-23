import { Board } from "./entities/Board";
import { BoardColor } from "./boardColors";
import { MemberRole } from "../members/memberRoles";
import { BoardStats, EMPTY_BOARD_STATS } from "./services/boardStats";

export interface BoardView {
  id: string;
  name: string;
  color: BoardColor;
  blockListDeletionWithCards: boolean;
  role: MemberRole;
  listCount: number;
  cardCount: number;
  overdueCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toBoardView(
  board: Board,
  role: MemberRole,
  stats: BoardStats = EMPTY_BOARD_STATS
): BoardView {
  return {
    id: board.id,
    name: board.name,
    color: board.color,
    blockListDeletionWithCards: board.blockListDeletionWithCards,
    role,
    listCount: stats.listCount,
    cardCount: stats.cardCount,
    overdueCount: stats.overdueCount,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}
