import type { BoardRole } from "../../domain/permissions";
import { UniqueConstraintError } from "../../errors/AppError";
import type { BoardScope } from "../../repositories/BoardRepository";
import type { LockResult } from "../../repositories/boardLock";
import type {
  MemberRecord,
  MemberRepository,
  MemberTransaction,
  NewInvitation,
} from "../../repositories/MemberRepository";
import type { MembersState } from "../../domain/members";
import type { InMemoryBoardRepository } from "./InMemoryBoardRepository";

/**
 * In-memory member repository on the shared store and board lock: every write
 * is serialized per board, primitives are filtered by board, UNIQUE (board_id,
 * email) is enforced and removing a participant cascades to its assignments.
 */
export class InMemoryMemberRepository implements MemberRepository {
  readonly calls: string[][] = [];
  failOn: keyof MemberTransaction | null = null;
  /** Skips the service-level duplicate check window to exercise the unique constraint (F87). */
  hideInvitationsFromLookup = false;

  constructor(private readonly store: InMemoryBoardRepository) {}

  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: MemberTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>> {
    return this.store.lock.run(scope, boardId, (role) => {
      const calls: string[] = [];
      this.calls.push(calls);
      return work(this.transaction(boardId, calls), role);
    });
  }

  async findState(scope: BoardScope, boardId: string): Promise<MembersState | null> {
    const role = this.store.roleOf(scope, boardId);
    if (!role) return null;
    return { myRole: role, members: this.store.membersOf(boardId), invitations: this.store.invitationsOf(boardId) };
  }

  private transaction(boardId: string, calls: string[]): MemberTransaction {
    const store = this.store;
    const statement = async <T>(name: keyof MemberTransaction, run: () => T): Promise<T> => {
      calls.push(name);
      // Yield so that concurrent callers would interleave if the lock did not serialize them.
      await Promise.resolve();
      if (this.failOn === name) throw new Error(`${name} failed`);
      return run();
    };
    const invitationRows = () => [...store.invitations.values()].filter((row) => row.boardId === boardId);
    const toRecord = (userId: string): MemberRecord | null => {
      const row = store.member(boardId, userId);
      return row ? { userId: row.userId, role: row.role } : null;
    };

    return {
      listMembers: () => statement("listMembers", () => store.membersOf(boardId)),
      listInvitations: () => statement("listInvitations", () => store.invitationsOf(boardId)),
      countPeople: () => statement("countPeople", () => store.membersOf(boardId).length + invitationRows().length),
      countAdmins: () =>
        statement("countAdmins", () => store.membersOf(boardId).filter((member) => member.role === "admin").length),
      findMember: (userId) => statement("findMember", () => toRecord(userId)),
      isMemberEmail: (email) =>
        statement("isMemberEmail", () => store.membersOf(boardId).some((member) => member.email === email)),
      findInvitation: (invitationId) =>
        statement("findInvitation", () => {
          const row = store.invitations.get(invitationId);
          return row && row.boardId === boardId ? { id: row.id, email: row.email, role: row.role } : null;
        }),
      findInvitationByEmail: (email) =>
        statement("findInvitationByEmail", () => {
          if (this.hideInvitationsFromLookup) return null;
          const row = invitationRows().find((item) => item.email === email);
          return row ? { id: row.id, email: row.email, role: row.role } : null;
        }),
      insertInvitation: (invitation: NewInvitation) =>
        statement("insertInvitation", () => {
          if (invitationRows().some((row) => row.email === invitation.email)) {
            throw new UniqueConstraintError("UQ_board_invitations_board_email");
          }
          store.invitations.set(invitation.id, { ...invitation, boardId, createdAt: store.now() });
        }),
      updateInvitationRole: (invitationId, role) =>
        statement("updateInvitationRole", () => {
          const row = store.invitations.get(invitationId);
          if (row && row.boardId === boardId) row.role = role;
        }),
      deleteInvitation: (invitationId) =>
        statement("deleteInvitation", () => {
          if (store.invitations.get(invitationId)?.boardId === boardId) store.invitations.delete(invitationId);
        }),
      updateMemberRole: (userId, role) =>
        statement("updateMemberRole", () => {
          const row = store.member(boardId, userId);
          if (row) row.role = role;
        }),
      deleteMember: (userId) => statement("deleteMember", () => store.deleteMember(boardId, userId)),
    };
  }
}
