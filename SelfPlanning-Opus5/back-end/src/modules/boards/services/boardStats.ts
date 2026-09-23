import { AppDataSource } from "../../../database/data-source";
import { todayAsIsoDate } from "../../cards/cardView";
import { Card } from "../../cards/entities/Card";
import { BoardList } from "../../lists/entities/BoardList";

export interface BoardStats {
  listCount: number;
  cardCount: number;
  overdueCount: number;
}

export const EMPTY_BOARD_STATS: BoardStats = { listCount: 0, cardCount: 0, overdueCount: 0 };

/** Totais de listas, cards e cards atrasados de cada quadro, em três consultas. */
export async function statsByBoards(boardIds: string[]): Promise<Map<string, BoardStats>> {
  const stats = new Map<string, BoardStats>(
    boardIds.map((boardId) => [boardId, { ...EMPTY_BOARD_STATS }])
  );

  if (boardIds.length === 0) {
    return stats;
  }

  const listRows = await AppDataSource.getRepository(BoardList)
    .createQueryBuilder("list")
    .select("list.board_id", "boardId")
    .addSelect("COUNT(list.id)", "total")
    .where("list.board_id IN (:...boardIds)", { boardIds })
    .groupBy("list.board_id")
    .getRawMany<{ boardId: string; total: string }>();

  for (const row of listRows) {
    const current = stats.get(row.boardId);

    if (current) {
      current.listCount = Number(row.total);
    }
  }

  const cardRows = await AppDataSource.getRepository(Card)
    .createQueryBuilder("card")
    .innerJoin(BoardList, "list", "list.id = card.list_id")
    .select("list.board_id", "boardId")
    .addSelect("COUNT(card.id)", "total")
    .addSelect("COUNT(card.id) FILTER (WHERE card.due_date < :today)", "overdue")
    .where("list.board_id IN (:...boardIds)", { boardIds })
    .setParameter("today", todayAsIsoDate())
    .groupBy("list.board_id")
    .getRawMany<{ boardId: string; total: string; overdue: string }>();

  for (const row of cardRows) {
    const current = stats.get(row.boardId);

    if (current) {
      current.cardCount = Number(row.total);
      current.overdueCount = Number(row.overdue);
    }
  }

  return stats;
}

export async function statsOfBoard(boardId: string): Promise<BoardStats> {
  const stats = await statsByBoards([boardId]);

  return stats.get(boardId) ?? { ...EMPTY_BOARD_STATS };
}
