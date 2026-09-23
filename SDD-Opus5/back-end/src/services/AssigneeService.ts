import type { AssigneeRef } from "../domain/members";
import { assertCan } from "../domain/permissions";
import { AppError } from "../errors/AppError";
import type { AssigneeRepository, AssigneeTransaction } from "../repositories/AssigneeRepository";
import { isUuid } from "../schemas/board.schemas";
import { boardScopeFor } from "./boardAccess";

export type AssigneesResult = { assignees: AssigneeRef[] };

/** Assignees of a card: idempotent writes under the card lock (RF07 RN11, A55, CB16). */
export class AssigneeService {
  constructor(private readonly repository: AssigneeRepository) {}

  private async inCard<T>(
    userId: string,
    boardId: string,
    cardId: string,
    work: (tx: AssigneeTransaction) => Promise<T>,
  ): Promise<T> {
    const result = await this.repository.withCardLock(
      boardScopeFor(userId),
      boardId,
      isUuid(cardId) ? cardId : null,
      (tx, role) => {
        assertCan(role, "assignee.write");
        return work(tx);
      },
    );
    if (result.status === "board-not-found") throw new AppError("BOARD_NOT_FOUND");
    if (result.status === "card-not-found") throw new AppError("CARD_NOT_FOUND");
    return result.value;
  }

  /** Only participants; assigning twice changes nothing (RN11, CA36). */
  assign(userId: string, boardId: string, cardId: string, targetUserId: string): Promise<AssigneesResult> {
    return this.inCard(userId, boardId, cardId, async (tx) => {
      if (!isUuid(targetUserId) || !(await tx.isMember(targetUserId))) throw new AppError("ASSIGNEE_NOT_MEMBER");
      if (!(await tx.assign(targetUserId))) throw new AppError("ASSIGNEE_NOT_MEMBER");
      return { assignees: await tx.listAssignees() };
    });
  }

  /** Removing someone who is not an assignee is not an error (RN11). */
  unassign(userId: string, boardId: string, cardId: string, targetUserId: string): Promise<AssigneesResult> {
    return this.inCard(userId, boardId, cardId, async (tx) => {
      if (isUuid(targetUserId)) await tx.unassign(targetUserId);
      return { assignees: await tx.listAssignees() };
    });
  }
}
