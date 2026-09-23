import type { DataSource, EntityManager } from "typeorm";
import type { InvitationView, MembersState, MemberView } from "../domain/members";
import type { BoardRole } from "../domain/permissions";
import { UniqueConstraintError } from "../errors/AppError";
import type { BoardScope } from "./BoardRepository";
import { runInBoardLock, type LockResult } from "./boardLock";
import { loadInvitations, loadMembers } from "./members";
import { uniqueViolation } from "./pgErrors";

export type MemberRecord = { userId: string; role: BoardRole };
export type InvitationRecord = { id: string; email: string; role: BoardRole };
export type NewInvitation = { id: string; email: string; role: BoardRole; invitedBy: string };

/**
 * Primitive operations on the people of one locked board (RF07 plan 2.3). They
 * hold no rule: the service decides limits, last administrator and duplicates (F84).
 */
export interface MemberTransaction {
  listMembers(): Promise<MemberView[]>;
  listInvitations(): Promise<InvitationView[]>;
  /** Participants plus pending invitations (RN12). */
  countPeople(): Promise<number>;
  countAdmins(): Promise<number>;
  /** `null` when the account does not participate in this board (CB05). */
  findMember(userId: string): Promise<MemberRecord | null>;
  /** A participant of this board has an account with this e-mail. */
  isMemberEmail(email: string): Promise<boolean>;
  findInvitation(invitationId: string): Promise<InvitationRecord | null>;
  findInvitationByEmail(email: string): Promise<InvitationRecord | null>;
  /** Throws `UniqueConstraintError` when the e-mail already has an invitation here (F87). */
  insertInvitation(invitation: NewInvitation): Promise<void>;
  updateInvitationRole(invitationId: string, role: BoardRole): Promise<void>;
  deleteInvitation(invitationId: string): Promise<void>;
  updateMemberRole(userId: string, role: BoardRole): Promise<void>;
  /** Assignments of this person go by the composite foreign key (F83). */
  deleteMember(userId: string): Promise<void>;
}

export interface MemberRepository {
  /** Every change of participation or role runs under the board lock (F82, C150). */
  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: MemberTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>>;
  /** Read without lock, scoped by participation; `null` when the account does not participate. */
  findState(scope: BoardScope, boardId: string): Promise<MembersState | null>;
}

class TypeOrmMemberTransaction implements MemberTransaction {
  constructor(
    private readonly manager: EntityManager,
    private readonly boardId: string,
  ) {}

  listMembers(): Promise<MemberView[]> {
    return loadMembers(this.manager, this.boardId);
  }

  listInvitations(): Promise<InvitationView[]> {
    return loadInvitations(this.manager, this.boardId);
  }

  async countPeople(): Promise<number> {
    const rows: Array<{ total: number }> = await this.manager.query(
      `SELECT (SELECT count(*) FROM board_members WHERE board_id = $1)
            + (SELECT count(*) FROM board_invitations WHERE board_id = $1) AS total`,
      [this.boardId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async countAdmins(): Promise<number> {
    const rows: Array<{ total: number }> = await this.manager.query(
      `SELECT count(*)::int AS total FROM board_members WHERE board_id = $1 AND role = 'admin'`,
      [this.boardId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async findMember(userId: string): Promise<MemberRecord | null> {
    const rows: Array<{ user_id: string; role: BoardRole }> = await this.manager.query(
      `SELECT user_id, role FROM board_members WHERE board_id = $1 AND user_id = $2`,
      [this.boardId, userId],
    );
    const row = rows[0];
    return row ? { userId: row.user_id, role: row.role } : null;
  }

  async isMemberEmail(email: string): Promise<boolean> {
    const rows: Array<{ user_id: string }> = await this.manager.query(
      `SELECT m.user_id
         FROM board_members m
         JOIN users u ON u.id = m.user_id
        WHERE m.board_id = $1 AND u.email = $2`,
      [this.boardId, email],
    );
    return rows.length > 0;
  }

  async findInvitation(invitationId: string): Promise<InvitationRecord | null> {
    const rows: InvitationRecord[] = await this.manager.query(
      `SELECT id, email, role FROM board_invitations WHERE board_id = $1 AND id = $2`,
      [this.boardId, invitationId],
    );
    return rows[0] ?? null;
  }

  async findInvitationByEmail(email: string): Promise<InvitationRecord | null> {
    const rows: InvitationRecord[] = await this.manager.query(
      `SELECT id, email, role FROM board_invitations WHERE board_id = $1 AND email = $2`,
      [this.boardId, email],
    );
    return rows[0] ?? null;
  }

  async insertInvitation(invitation: NewInvitation): Promise<void> {
    try {
      await this.manager.query(
        `INSERT INTO board_invitations (id, board_id, email, role, invited_by) VALUES ($1, $2, $3, $4, $5)`,
        [invitation.id, this.boardId, invitation.email, invitation.role, invitation.invitedBy],
      );
    } catch (error) {
      const constraint = uniqueViolation(error);
      if (constraint !== undefined) throw new UniqueConstraintError(constraint);
      throw error;
    }
  }

  async updateInvitationRole(invitationId: string, role: BoardRole): Promise<void> {
    await this.manager.query(`UPDATE board_invitations SET role = $3 WHERE board_id = $1 AND id = $2`, [
      this.boardId,
      invitationId,
      role,
    ]);
  }

  async deleteInvitation(invitationId: string): Promise<void> {
    await this.manager.query(`DELETE FROM board_invitations WHERE board_id = $1 AND id = $2`, [
      this.boardId,
      invitationId,
    ]);
  }

  async updateMemberRole(userId: string, role: BoardRole): Promise<void> {
    await this.manager.query(`UPDATE board_members SET role = $3 WHERE board_id = $1 AND user_id = $2`, [
      this.boardId,
      userId,
      role,
    ]);
  }

  async deleteMember(userId: string): Promise<void> {
    await this.manager.query(`DELETE FROM board_members WHERE board_id = $1 AND user_id = $2`, [this.boardId, userId]);
  }
}

export class TypeOrmMemberRepository implements MemberRepository {
  constructor(private readonly dataSource: DataSource) {}

  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: MemberTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>> {
    return runInBoardLock(this.dataSource, scope, boardId, (manager, role) =>
      work(new TypeOrmMemberTransaction(manager, boardId), role),
    );
  }

  async findState(scope: BoardScope, boardId: string): Promise<MembersState | null> {
    const rows: Array<{ role: BoardRole }> = await this.dataSource.query(
      `SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2`,
      [boardId, scope.userId],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      myRole: row.role,
      members: await loadMembers(this.dataSource, boardId),
      invitations: await loadInvitations(this.dataSource, boardId),
    };
  }
}
