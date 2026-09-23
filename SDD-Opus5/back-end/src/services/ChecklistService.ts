import { randomUUID } from "node:crypto";
import { CHECKLIST_MAX_ITEMS, type ChecklistItem } from "../domain/checklist";
import { assertCan } from "../domain/permissions";
import { AppError } from "../errors/AppError";
import type { ChecklistRepository, ChecklistTransaction } from "../repositories/ChecklistRepository";
import { isUuid } from "../schemas/board.schemas";
import type { CreateChecklistItemInput, UpdateChecklistItemInput } from "../schemas/checklist.schemas";
import { boardScopeFor } from "./boardAccess";

export type ChecklistItemResult = { item: ChecklistItem; checklist: ChecklistItem[] };
export type ChecklistResult = { checklist: ChecklistItem[] };

export class ChecklistService {
  constructor(private readonly repository: ChecklistRepository) {}

  /** Board, then card, then role, before any item is read (C121, N116, RF07 C148). */
  private async inCard<T>(
    userId: string,
    boardId: string,
    cardId: string,
    work: (tx: ChecklistTransaction) => Promise<T>,
  ): Promise<T> {
    const result = await this.repository.withCardLock(
      boardScopeFor(userId),
      boardId,
      isUuid(cardId) ? cardId : null,
      (tx, role) => {
        assertCan(role, "checklist.write");
        return work(tx);
      },
    );
    if (result.status === "board-not-found") throw new AppError("BOARD_NOT_FOUND");
    if (result.status === "card-not-found") throw new AppError("CARD_NOT_FOUND");
    return result.value;
  }

  private async requireItem(tx: ChecklistTransaction, itemId: string): Promise<ChecklistItem> {
    if (!isUuid(itemId)) throw new AppError("CHECKLIST_ITEM_NOT_FOUND");
    const item = await tx.findItem(itemId);
    if (!item) throw new AppError("CHECKLIST_ITEM_NOT_FOUND");
    return item;
  }

  private static pick(checklist: ChecklistItem[], itemId: string): ChecklistItem {
    const item = checklist.find((entry) => entry.id === itemId);
    if (!item) throw new Error("Checklist item missing right after a write");
    return item;
  }

  /** At the end, not done, within the 100-item limit checked under the card lock (RN06, RN07, RN16). */
  add(userId: string, boardId: string, cardId: string, input: CreateChecklistItemInput): Promise<ChecklistItemResult> {
    return this.inCard(userId, boardId, cardId, async (tx) => {
      if ((await tx.count()) >= CHECKLIST_MAX_ITEMS) throw new AppError("CHECKLIST_LIMIT_REACHED");

      const id = randomUUID();
      await tx.insert({ id, text: input.text, done: false, position: await tx.nextPosition() });

      const checklist = await tx.listItems();
      return { item: ChecklistService.pick(checklist, id), checklist };
    });
  }

  /** Writes only the fields sent; `done` is the desired state (RN08, CB15). */
  update(
    userId: string,
    boardId: string,
    cardId: string,
    itemId: string,
    input: UpdateChecklistItemInput,
  ): Promise<ChecklistItemResult> {
    return this.inCard(userId, boardId, cardId, async (tx) => {
      const item = await this.requireItem(tx, itemId);
      await tx.update(item.id, { text: input.text, done: input.done });

      const checklist = await tx.listItems();
      return { item: ChecklistService.pick(checklist, item.id), checklist };
    });
  }

  remove(userId: string, boardId: string, cardId: string, itemId: string): Promise<ChecklistResult> {
    return this.inCard(userId, boardId, cardId, async (tx) => {
      const item = await this.requireItem(tx, itemId);
      await tx.remove(item.id);
      return { checklist: await tx.listItems() };
    });
  }
}
