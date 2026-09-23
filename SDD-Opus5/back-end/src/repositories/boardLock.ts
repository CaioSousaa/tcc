import type { DataSource, EntityManager } from "typeorm";
import type { BoardRole } from "../domain/permissions";
import type { BoardScope } from "./BoardRepository";

export type LockResult<T> = { found: true; value: T } | { found: false };

/**
 * The only implementation of the board lock (RF04 F34, C67). Every structural
 * write on a board runs here, serialized per board (RF03 C46/C47): a transaction,
 * a lock timeout (N46) and a row lock on the board. Participation and role are
 * resolved in the same statement that takes the lock (RF07 F79, C147), so `work`
 * always receives the role at processing time (RN06). When the account does not
 * participate, `work` is not called. Any error rolls back.
 */
export function runInBoardLock<T>(
  dataSource: DataSource,
  scope: BoardScope,
  boardId: string,
  work: (manager: EntityManager, role: BoardRole) => Promise<T>,
): Promise<LockResult<T>> {
  return dataSource.transaction(async (manager): Promise<LockResult<T>> => {
    await manager.query(`SET LOCAL lock_timeout = '5s'`);

    const rows: Array<{ role: BoardRole }> = await manager.query(
      `SELECT m.role
         FROM boards b
         JOIN board_members m ON m.board_id = b.id AND m.user_id = $2
        WHERE b.id = $1
        FOR UPDATE OF b`,
      [boardId, scope.userId],
    );
    const row = rows[0];
    if (!row) return { found: false };

    return { found: true, value: await work(manager, row.role) };
  });
}

/**
 * Same lock without requiring participation: used only to answer an invitation,
 * whose account is not a participant yet (RF07 plan 2.4, CB12). Callers must
 * have checked that the invitation belongs to the session e-mail.
 */
export function runInBoardLockForInvitation<T>(
  dataSource: DataSource,
  boardId: string,
  work: (manager: EntityManager) => Promise<T>,
): Promise<LockResult<T>> {
  return dataSource.transaction(async (manager): Promise<LockResult<T>> => {
    await manager.query(`SET LOCAL lock_timeout = '5s'`);

    const rows: Array<{ id: string }> = await manager.query(`SELECT id FROM boards WHERE id = $1 FOR UPDATE`, [boardId]);
    if (rows.length === 0) return { found: false };

    return { found: true, value: await work(manager) };
  });
}
