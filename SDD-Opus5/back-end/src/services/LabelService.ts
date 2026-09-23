import { randomUUID } from "node:crypto";
import { LABELS_MAX, type LabelView } from "../domain/labels";
import { assertCan, type BoardRole } from "../domain/permissions";
import { AppError, UniqueConstraintError } from "../errors/AppError";
import type { LabelRecord, LabelRepository, LabelTransaction } from "../repositories/LabelRepository";
import { isUuid } from "../schemas/board.schemas";
import type { LabelInput } from "../schemas/label.schemas";
import { boardScopeFor } from "./boardAccess";

export type LabelsResult = { labels: LabelView[] };
export type LabelMutationResult = { label: LabelView; labels: LabelView[] };

function pick(labels: LabelView[], labelId: string): LabelView {
  const label = labels.find((item) => item.id === labelId);
  if (!label) throw new Error("Label missing right after a write");
  return label;
}

/**
 * Labels of a board (RF08 plan 2.4). Writes run under the board lock: participation,
 * then "labels.manage", then the label, then the state rules (F96, F98).
 */
export class LabelService {
  constructor(private readonly repository: LabelRepository) {}

  private async manage<T>(userId: string, boardId: string, work: (tx: LabelTransaction) => Promise<T>): Promise<T> {
    const result = await this.repository.withBoardLock(boardScopeFor(userId), boardId, (tx, role: BoardRole) => {
      assertCan(role, "labels.manage");
      return work(tx);
    });
    if (!result.found) throw new AppError("BOARD_NOT_FOUND");
    return result.value;
  }

  private static async requireLabel(tx: LabelTransaction, labelId: string): Promise<LabelRecord> {
    if (!isUuid(labelId)) throw new AppError("LABEL_NOT_FOUND");
    const label = await tx.findLabel(labelId);
    if (!label) throw new AppError("LABEL_NOT_FOUND");
    return label;
  }

  /** The unique index is the last barrier against a duplicate name (F104). */
  private static async write(run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch (error) {
      if (error instanceof UniqueConstraintError) throw new AppError("LABEL_NAME_TAKEN");
      throw error;
    }
  }

  /** Any participant sees the labels with their usage (RN05). */
  async list(userId: string, boardId: string): Promise<LabelView[]> {
    const labels = await this.repository.findLabels(boardScopeFor(userId), boardId);
    if (!labels) throw new AppError("BOARD_NOT_FOUND");
    return labels;
  }

  /** At the end of the order, within the limit and with a unique name (RN04, RN06, RN11). */
  create(userId: string, boardId: string, input: LabelInput): Promise<LabelMutationResult> {
    return this.manage(userId, boardId, async (tx) => {
      if ((await tx.count()) >= LABELS_MAX) throw new AppError("LABEL_LIMIT_REACHED");
      if (await tx.isNameTaken(input.name)) throw new AppError("LABEL_NAME_TAKEN");

      const id = randomUUID();
      await LabelService.write(() => tx.insert({ id, name: input.name, color: input.color }));

      const labels = await tx.listLabels();
      return { label: pick(labels, id), labels };
    });
  }

  /** The label itself never conflicts, so changing only the case is accepted (CA15, CB08). */
  update(userId: string, boardId: string, labelId: string, input: LabelInput): Promise<LabelMutationResult> {
    return this.manage(userId, boardId, async (tx) => {
      const label = await LabelService.requireLabel(tx, labelId);
      if (await tx.isNameTaken(input.name, label.id)) throw new AppError("LABEL_NAME_TAKEN");

      await LabelService.write(() => tx.update(label.id, { name: input.name, color: input.color }));

      const labels = await tx.listLabels();
      return { label: pick(labels, label.id), labels };
    });
  }

  /** Removed from every card in the same statement; no card is deleted (RN10). */
  delete(userId: string, boardId: string, labelId: string): Promise<LabelsResult> {
    return this.manage(userId, boardId, async (tx) => {
      const label = await LabelService.requireLabel(tx, labelId);
      await tx.delete(label.id);
      return { labels: await tx.listLabels() };
    });
  }
}
