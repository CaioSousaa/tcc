import type { LabelView } from "../domain/labels";
import { assertCan } from "../domain/permissions";
import { AppError } from "../errors/AppError";
import type { CardLabelRepository, CardLabelTransaction } from "../repositories/CardLabelRepository";
import { isUuid } from "../schemas/board.schemas";
import { boardScopeFor } from "./boardAccess";

export type CardLabelsResult = { labelIds: string[]; labels: LabelView[] };

/** Labels applied to a card: idempotent writes under the card lock (RF08 RN07, A61). */
export class CardLabelService {
  constructor(private readonly repository: CardLabelRepository) {}

  /** Board, permission, card, then label (F98). */
  private async onLabel(
    userId: string,
    boardId: string,
    cardId: string,
    labelId: string,
    work: (tx: CardLabelTransaction, labelId: string) => Promise<void>,
  ): Promise<CardLabelsResult> {
    const result = await this.repository.withCardLock(
      boardScopeFor(userId),
      boardId,
      isUuid(cardId) ? cardId : null,
      async (tx, role) => {
        assertCan(role, "labels.apply");
        if (!isUuid(labelId) || !(await tx.findLabel(labelId))) throw new AppError("LABEL_NOT_FOUND");
        await work(tx, labelId);
        return { labelIds: await tx.listCardLabelIds(), labels: await tx.listLabels() };
      },
    );
    if (result.status === "board-not-found") throw new AppError("BOARD_NOT_FOUND");
    if (result.status === "card-not-found") throw new AppError("CARD_NOT_FOUND");
    return result.value;
  }

  /** Applying twice changes nothing (RN07, CB11). */
  apply(userId: string, boardId: string, cardId: string, labelId: string): Promise<CardLabelsResult> {
    return this.onLabel(userId, boardId, cardId, labelId, async (tx, id) => {
      // Deleted between the lookup and the insert (N171).
      if (!(await tx.apply(id))) throw new AppError("LABEL_NOT_FOUND");
    });
  }

  /** Removing a label that is not applied is not an error (RN07). */
  remove(userId: string, boardId: string, cardId: string, labelId: string): Promise<CardLabelsResult> {
    return this.onLabel(userId, boardId, cardId, labelId, (tx, id) => tx.remove(id));
  }
}
