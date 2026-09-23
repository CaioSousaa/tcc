import type { BoardSummary } from "../domain/boards";
import type { UserInvitationView } from "../domain/members";
import { AppError } from "../errors/AppError";
import type { InvitationRepository, InvitationTransaction } from "../repositories/InvitationRepository";
import type { InvitationRecord } from "../repositories/MemberRepository";
import { isUuid } from "../schemas/board.schemas";

/** The account answering an invitation: identity and e-mail always come from the session (RN08). */
export type InvitationAccount = { id: string; email: string };

/**
 * Invitations addressed to the session e-mail (RF07 plan 2.4, 4.5). Anything
 * else, including a board deleted meanwhile, is "Convite não encontrado." (N141, CB19).
 */
export class InvitationService {
  constructor(private readonly repository: InvitationRepository) {}

  list(account: InvitationAccount): Promise<UserInvitationView[]> {
    return this.repository.listForEmail(account.email);
  }

  /** Steps 1–3 of the acceptance: find the board, lock it, read the invitation again. */
  private async onInvitation<T>(
    account: InvitationAccount,
    invitationId: string,
    work: (tx: InvitationTransaction, invitation: InvitationRecord) => Promise<T>,
  ): Promise<T> {
    if (!isUuid(invitationId)) throw new AppError("INVITATION_NOT_FOUND");
    const boardId = await this.repository.findBoardId(invitationId, account.email);
    if (!boardId) throw new AppError("INVITATION_NOT_FOUND");

    const result = await this.repository.withInvitationBoardLock(boardId, async (tx) => {
      // Cancelled or answered while waiting for the lock (CB12).
      const invitation = await tx.findInvitation(invitationId, account.email);
      if (!invitation) throw new AppError("INVITATION_NOT_FOUND");
      return work(tx, invitation);
    });
    if (!result.found) throw new AppError("INVITATION_NOT_FOUND");
    return result.value;
  }

  /** Participant with the current role of the invitation, in the same transaction that removes it (RN09, C156). */
  accept(account: InvitationAccount, invitationId: string, today: string | null = null): Promise<BoardSummary> {
    return this.onInvitation(account, invitationId, async (tx, invitation) => {
      // Defensive: an account that already participates only loses the invitation.
      if (!(await tx.isMember(account.id))) await tx.insertMember(account.id, invitation.role);
      await tx.deleteInvitation(invitation.id);

      const board = await tx.boardSummary(account.id, today);
      if (!board) throw new Error("Board missing right after accepting its invitation");
      return board;
    });
  }

  decline(account: InvitationAccount, invitationId: string): Promise<void> {
    return this.onInvitation(account, invitationId, (tx, invitation) => tx.deleteInvitation(invitation.id));
  }
}
