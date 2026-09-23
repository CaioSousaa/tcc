import type { DataSource, EntityManager } from "typeorm";
import type { BoardColor } from "../domain/boardColors";
import type { BoardSummary } from "../domain/boards";
import type { UserInvitationView } from "../domain/members";
import type { BoardRole } from "../domain/permissions";
import { loadBoardSummary } from "./BoardRepository";
import { runInBoardLockForInvitation, type LockResult } from "./boardLock";
import type { InvitationRecord } from "./MemberRepository";

/** Primitive operations to answer one invitation, on its locked board (RF07 plan 2.4). */
export interface InvitationTransaction {
  /** Invitation of the locked board addressed to `email`, or `null` (RN08). */
  findInvitation(invitationId: string, email: string): Promise<InvitationRecord | null>;
  isMember(userId: string): Promise<boolean>;
  insertMember(userId: string, role: BoardRole): Promise<void>;
  deleteInvitation(invitationId: string): Promise<void>;
  /** `today` of the viewer for the overdue count (RF10 A70). */
  boardSummary(userId: string, today: string | null): Promise<BoardSummary | null>;
}

export interface InvitationRepository {
  /** Invitations addressed to `email`, newest first (CB09). */
  listForEmail(email: string): Promise<UserInvitationView[]>;
  /** Board of an invitation addressed to `email`, read without lock; `null` otherwise (N141). */
  findBoardId(invitationId: string, email: string): Promise<string | null>;
  withInvitationBoardLock<T>(boardId: string, work: (tx: InvitationTransaction) => Promise<T>): Promise<LockResult<T>>;
}

type UserInvitationRow = {
  id: string;
  role: BoardRole;
  created_at: Date;
  board_id: string;
  board_name: string;
  board_color: BoardColor;
  invited_by_name: string;
};

class TypeOrmInvitationTransaction implements InvitationTransaction {
  constructor(
    private readonly manager: EntityManager,
    private readonly boardId: string,
  ) {}

  async findInvitation(invitationId: string, email: string): Promise<InvitationRecord | null> {
    const rows: InvitationRecord[] = await this.manager.query(
      `SELECT id, email, role FROM board_invitations WHERE board_id = $1 AND id = $2 AND email = $3`,
      [this.boardId, invitationId, email],
    );
    return rows[0] ?? null;
  }

  async isMember(userId: string): Promise<boolean> {
    const rows: Array<{ user_id: string }> = await this.manager.query(
      `SELECT user_id FROM board_members WHERE board_id = $1 AND user_id = $2`,
      [this.boardId, userId],
    );
    return rows.length > 0;
  }

  async insertMember(userId: string, role: BoardRole): Promise<void> {
    // joined_at defaults to now(): whoever accepts enters at the moment of acceptance (RN13).
    await this.manager.query(`INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)`, [
      this.boardId,
      userId,
      role,
    ]);
  }

  async deleteInvitation(invitationId: string): Promise<void> {
    await this.manager.query(`DELETE FROM board_invitations WHERE board_id = $1 AND id = $2`, [
      this.boardId,
      invitationId,
    ]);
  }

  boardSummary(userId: string, today: string | null): Promise<BoardSummary | null> {
    return loadBoardSummary(this.manager, userId, this.boardId, today);
  }
}

export class TypeOrmInvitationRepository implements InvitationRepository {
  constructor(private readonly dataSource: DataSource) {}

  async listForEmail(email: string): Promise<UserInvitationView[]> {
    const rows: UserInvitationRow[] = await this.dataSource.query(
      `SELECT i.id, i.role, i.created_at,
              b.id AS board_id, b.name AS board_name, b.color AS board_color,
              u.name AS invited_by_name
         FROM board_invitations i
         JOIN boards b ON b.id = i.board_id
         JOIN users u ON u.id = i.invited_by
        WHERE i.email = $1
        ORDER BY i.created_at DESC, i.id DESC`,
      [email],
    );
    return rows.map((row) => ({
      id: row.id,
      role: row.role,
      createdAt: new Date(row.created_at).toISOString(),
      board: { id: row.board_id, name: row.board_name, color: row.board_color },
      invitedBy: { name: row.invited_by_name },
    }));
  }

  async findBoardId(invitationId: string, email: string): Promise<string | null> {
    const rows: Array<{ board_id: string }> = await this.dataSource.query(
      `SELECT board_id FROM board_invitations WHERE id = $1 AND email = $2`,
      [invitationId, email],
    );
    return rows[0]?.board_id ?? null;
  }

  withInvitationBoardLock<T>(boardId: string, work: (tx: InvitationTransaction) => Promise<T>): Promise<LockResult<T>> {
    return runInBoardLockForInvitation(this.dataSource, boardId, (manager) =>
      work(new TypeOrmInvitationTransaction(manager, boardId)),
    );
  }
}
