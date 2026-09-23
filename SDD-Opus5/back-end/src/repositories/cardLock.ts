import type { DataSource, EntityManager } from "typeorm";
import type { BoardRole } from "../domain/permissions";
import type { BoardScope } from "./BoardRepository";

export type CardLockResult<T> =
  | { status: "board-not-found" }
  | { status: "card-not-found" }
  | { status: "ok"; value: T };

/**
 * Row lock on one card of a board the account participates in (RF06 F63, F64;
 * RF07 F79). Writes inside a card are serialized per card; deleting or moving the
 * card waits on the same row lock. The role is read in this transaction.
 * `cardId` is `null` when it is not a valid id: only participation is checked.
 */
export function runInCardLock<T>(
  dataSource: DataSource,
  scope: BoardScope,
  boardId: string,
  cardId: string | null,
  work: (manager: EntityManager, role: BoardRole) => Promise<T>,
): Promise<CardLockResult<T>> {
  return dataSource.transaction(async (manager): Promise<CardLockResult<T>> => {
    await manager.query(`SET LOCAL lock_timeout = '5s'`);

    const members: Array<{ role: BoardRole }> = await manager.query(
      `SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2`,
      [boardId, scope.userId],
    );
    const member = members[0];
    if (!member) return { status: "board-not-found" };
    if (cardId === null) return { status: "card-not-found" };

    const cards: Array<{ id: string }> = await manager.query(
      `SELECT c.id
         FROM cards c
         JOIN lists l ON l.id = c.list_id
        WHERE c.id = $1 AND l.board_id = $2
        FOR UPDATE OF c`,
      [cardId, boardId],
    );
    if (cards.length === 0) return { status: "card-not-found" };

    return { status: "ok", value: await work(manager, member.role) };
  });
}
