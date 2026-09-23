import type { DataSource, EntityManager } from "typeorm";
import type { BoardColor } from "../domain/boardColors";
import type { BoardDetail, BoardSummary } from "../domain/boards";
import { MEMBER_PREVIEW_MAX, type MemberPreview } from "../domain/members";
import type { BoardRole } from "../domain/permissions";
import { runInBoardLock, type LockResult } from "./boardLock";
import { loadLabels } from "./labels";
import { loadListsWithCards } from "./listsWithCards";
import { loadMembers, toBoardMembers } from "./members";

/**
 * Who reaches a board. Every repository method requires it, so no board can be
 * read or written by id alone (RF02 F9, C27). Since RF07 access is participation
 * in `board_members`; `boards.owner_id` only records who created it (F77, D30).
 */
export type BoardScope = { userId: string };

export type NewBoardList = { id: string; name: string; position: number };

export type NewBoard = {
  id: string;
  name: string;
  color: BoardColor;
  lists: NewBoardList[];
};

/** `lockListDeletion` undefined keeps the current value (RF05 CB09). */
export type BoardChanges = { name: string; color: BoardColor; lockListDeletion?: boolean | undefined };

/** Primitive writes on one locked board, without rules (RF07: update/delete need the role first). */
export interface BoardTransaction {
  update(changes: BoardChanges): Promise<void>;
  /** Lists, cards, members, invitations and assignments go by ON DELETE CASCADE (RF02 F13, RF07 RN15). */
  delete(): Promise<void>;
  summary(): Promise<BoardSummary | null>;
}

export interface BoardRepository {
  /** `today` (YYYY-MM-DD) of the viewer for the overdue count; `null` uses the database date (RF10 F139). */
  listSummaries(scope: BoardScope, today?: string | null): Promise<BoardSummary[]>;
  findSummary(scope: BoardScope, boardId: string): Promise<BoardSummary | null>;
  findDetail(scope: BoardScope, boardId: string): Promise<BoardDetail | null>;
  /** Board, its lists and the creator as administrator, atomically (RF02 F12, RF07 F85). */
  createWithLists(scope: BoardScope, board: NewBoard): Promise<void>;
  /** Board lock with participation and role (RF07 F79). */
  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: BoardTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>>;
}

type Queryable = Pick<EntityManager, "query">;

type SummaryRow = {
  id: string;
  name: string;
  color: BoardColor;
  list_count: number;
  card_count: number;
  member_count: number;
  member_preview: Array<{ userId: string; name: string }> | null;
  my_role: BoardRole;
  overdue_count: number;
  lock_list_deletion: boolean;
  created_at: Date;
  updated_at: Date;
};

// One statement whatever the number of boards and people (RF02 N23, RF07 N135).
// $1 is always the account: the JOIN is the participation filter and gives the role.
// $2 is always the viewer's today, or NULL for the database date (RF10 F139, N203).
const SUMMARY_SELECT = `
  SELECT
    b.id,
    b.name,
    b.color,
    b.created_at,
    b.updated_at,
    b.lock_list_deletion,
    me.role AS my_role,
    (SELECT count(*)::int FROM lists l WHERE l.board_id = b.id) AS list_count,
    (SELECT count(*)::int FROM cards c JOIN lists l ON l.id = c.list_id WHERE l.board_id = b.id) AS card_count,
    (SELECT count(*)::int FROM board_members bm WHERE bm.board_id = b.id) AS member_count,
    (SELECT count(*)::int
       FROM cards c
       JOIN lists l ON l.id = c.list_id
      WHERE l.board_id = b.id
        AND c.due_date IS NOT NULL
        AND c.due_date < COALESCE($2::date, CURRENT_DATE)) AS overdue_count,
    (SELECT COALESCE(json_agg(json_build_object('userId', p.user_id, 'name', p.name) ORDER BY p.joined_at, p.user_id), '[]'::json)
       FROM (
         SELECT pm.user_id, pu.name, pm.joined_at
           FROM board_members pm
           JOIN users pu ON pu.id = pm.user_id
          WHERE pm.board_id = b.id
          ORDER BY pm.joined_at, pm.user_id
          LIMIT ${MEMBER_PREVIEW_MAX}
       ) p) AS member_preview
  FROM boards b
  JOIN board_members me ON me.board_id = b.id AND me.user_id = $1
`;

function toSummary(row: SummaryRow): BoardSummary {
  const preview: MemberPreview[] = (row.member_preview ?? []).map((item) => ({
    userId: String(item.userId),
    name: String(item.name),
  }));
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    listCount: Number(row.list_count),
    cardCount: Number(row.card_count),
    lockListDeletion: row.lock_list_deletion === true,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    myRole: row.my_role,
    memberCount: Number(row.member_count),
    memberPreview: preview,
    overdueCount: Number(row.overdue_count ?? 0),
  };
}

/** Summary of one board for one participant; `null` when the account does not participate. */
export async function loadBoardSummary(
  db: Queryable,
  userId: string,
  boardId: string,
  today: string | null = null,
): Promise<BoardSummary | null> {
  const rows: SummaryRow[] = await db.query(`${SUMMARY_SELECT} WHERE b.id = $3`, [userId, today, boardId]);
  const row = rows[0];
  return row ? toSummary(row) : null;
}

class TypeOrmBoardTransaction implements BoardTransaction {
  constructor(
    private readonly manager: EntityManager,
    private readonly scope: BoardScope,
    private readonly boardId: string,
  ) {}

  async update(changes: BoardChanges): Promise<void> {
    await this.manager.query(
      `UPDATE boards
          SET name = $2,
              color = $3,
              lock_list_deletion = COALESCE($4, lock_list_deletion),
              updated_at = now()
        WHERE id = $1`,
      [this.boardId, changes.name, changes.color, changes.lockListDeletion ?? null],
    );
  }

  async delete(): Promise<void> {
    await this.manager.query(`DELETE FROM boards WHERE id = $1`, [this.boardId]);
  }

  summary(): Promise<BoardSummary | null> {
    return loadBoardSummary(this.manager, this.scope.userId, this.boardId);
  }
}

export class TypeOrmBoardRepository implements BoardRepository {
  constructor(private readonly dataSource: DataSource) {}

  async listSummaries(scope: BoardScope, today: string | null = null): Promise<BoardSummary[]> {
    const rows: SummaryRow[] = await this.dataSource.query(`${SUMMARY_SELECT} ORDER BY b.created_at DESC, b.id DESC`, [
      scope.userId,
      today,
    ]);
    return rows.map(toSummary);
  }

  findSummary(scope: BoardScope, boardId: string): Promise<BoardSummary | null> {
    return loadBoardSummary(this.dataSource, scope.userId, boardId);
  }

  async findDetail(scope: BoardScope, boardId: string): Promise<BoardDetail | null> {
    const summary = await this.findSummary(scope, boardId);
    if (!summary) return null;

    // Participation was confirmed by the scoped summary above; at most five statements (RF08 3.5, C193).
    const members = await loadMembers(this.dataSource, boardId);
    const labels = await loadLabels(this.dataSource, boardId);
    const lists = await loadListsWithCards(this.dataSource.manager, boardId);
    return { ...summary, members: toBoardMembers(members), labels, lists };
  }

  async createWithLists(scope: BoardScope, board: NewBoard): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // owner_id only records the creator; it is never used for authorization (D30).
      await manager.query(`INSERT INTO boards (id, owner_id, name, color) VALUES ($1, $2, $3, $4)`, [
        board.id,
        scope.userId,
        board.name,
        board.color,
      ]);
      await manager.query(`INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'admin')`, [
        board.id,
        scope.userId,
      ]);
      for (const list of board.lists) {
        await manager.query(`INSERT INTO lists (id, board_id, name, position) VALUES ($1, $2, $3, $4)`, [
          list.id,
          board.id,
          list.name,
          list.position,
        ]);
      }
    });
  }

  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: BoardTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>> {
    return runInBoardLock(this.dataSource, scope, boardId, (manager, role) =>
      work(new TypeOrmBoardTransaction(manager, scope, boardId), role),
    );
  }
}
