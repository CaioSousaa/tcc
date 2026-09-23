import type { UserInvitationView } from "../../domain/members";
import type { LockResult } from "../../repositories/boardLock";
import type { InvitationRepository, InvitationTransaction } from "../../repositories/InvitationRepository";
import type { InMemoryBoardRepository } from "./InMemoryBoardRepository";

/** In-memory invitation answers under the shared board lock, without participation (RF07 plan 2.4). */
export class InMemoryInvitationRepository implements InvitationRepository {
  constructor(private readonly store: InMemoryBoardRepository) {}

  async listForEmail(email: string): Promise<UserInvitationView[]> {
    return [...this.store.invitations.values()]
      .filter((row) => row.email === email && this.store.boards.has(row.boardId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1))
      .map((row) => {
        const board = this.store.boards.get(row.boardId);
        return {
          id: row.id,
          role: row.role,
          createdAt: row.createdAt.toISOString(),
          board: { id: row.boardId, name: board?.name ?? "", color: board?.color ?? "navy" },
          invitedBy: { name: this.store.user(row.invitedBy).name },
        };
      });
  }

  async findBoardId(invitationId: string, email: string): Promise<string | null> {
    const row = this.store.invitations.get(invitationId);
    return row && row.email === email ? row.boardId : null;
  }

  withInvitationBoardLock<T>(boardId: string, work: (tx: InvitationTransaction) => Promise<T>): Promise<LockResult<T>> {
    const store = this.store;
    return store.lock.runUnscoped(boardId, () =>
      work({
        findInvitation: async (invitationId, email) => {
          await Promise.resolve();
          const row = store.invitations.get(invitationId);
          return row && row.boardId === boardId && row.email === email ? { id: row.id, email: row.email, role: row.role } : null;
        },
        isMember: async (userId) => store.member(boardId, userId) !== undefined,
        insertMember: async (userId, role) => store.addMember(boardId, userId, role),
        deleteInvitation: async (invitationId) => {
          if (store.invitations.get(invitationId)?.boardId === boardId) store.invitations.delete(invitationId);
        },
        boardSummary: async (userId, today) => store.summaryFor(userId, boardId, today),
      }),
    );
  }
}
