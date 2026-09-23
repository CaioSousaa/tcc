import type { EntityManager } from "typeorm";
import type { AssigneeRef, BoardMember, InvitationView, MemberView } from "../domain/members";
import type { BoardRole } from "../domain/permissions";

type Queryable = Pick<EntityManager, "query">;

type MemberRow = { user_id: string; name: string; email: string; role: BoardRole; joined_at: Date };
type InvitationRow = { id: string; email: string; role: BoardRole; created_at: Date };

/** Participants of a board in order of entry (D34). Callers must have checked access. */
export async function loadMembers(db: Queryable, boardId: string): Promise<MemberView[]> {
  const rows: MemberRow[] = await db.query(
    `SELECT m.user_id, u.name, u.email, m.role, m.joined_at
       FROM board_members m
       JOIN users u ON u.id = m.user_id
      WHERE m.board_id = $1
      ORDER BY m.joined_at, m.user_id`,
    [boardId],
  );
  return rows.map((row) => ({
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    joinedAt: new Date(row.joined_at).toISOString(),
  }));
}

export function toBoardMembers(members: MemberView[]): BoardMember[] {
  return members.map(({ userId, name, email, role }) => ({ userId, name, email, role }));
}

/** Pending invitations of a board in order of sending (D34). */
export async function loadInvitations(db: Queryable, boardId: string): Promise<InvitationView[]> {
  const rows: InvitationRow[] = await db.query(
    `SELECT id, email, role, created_at FROM board_invitations WHERE board_id = $1 ORDER BY created_at, id`,
    [boardId],
  );
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

/** Assignees of one card in order of assignment (RN13). Callers must have resolved the card. */
export async function loadAssignees(db: Queryable, cardId: string): Promise<AssigneeRef[]> {
  const rows: Array<{ user_id: string; name: string }> = await db.query(
    `SELECT a.user_id, u.name
       FROM card_assignees a
       JOIN users u ON u.id = a.user_id
      WHERE a.card_id = $1
      ORDER BY a.assigned_at, a.user_id`,
    [cardId],
  );
  return rows.map((row) => ({ userId: row.user_id, name: row.name }));
}
