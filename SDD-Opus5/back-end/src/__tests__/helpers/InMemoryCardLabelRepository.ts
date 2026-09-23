import type { BoardRole } from "../../domain/permissions";
import type { BoardScope } from "../../repositories/BoardRepository";
import type { CardLabelRepository, CardLabelTransaction } from "../../repositories/CardLabelRepository";
import type { CardLockResult } from "../../repositories/cardLock";
import type { InMemoryBoardRepository } from "./InMemoryBoardRepository";

/** In-memory stand-in for runInCardLock with label primitives and the composite foreign key (RF08 D38). */
export class InMemoryCardLabelRepository implements CardLabelRepository {
  private readonly queues = new Map<string, Promise<unknown>>();
  readonly calls: string[][] = [];
  failOn: keyof CardLabelTransaction | null = null;
  /** Deletes the label right before `apply`, simulating a concurrent deletion (N171). */
  deleteLabelBeforeApply: string | null = null;

  constructor(private readonly store: InMemoryBoardRepository) {}

  async withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: CardLabelTransaction, role: BoardRole) => Promise<T>,
  ): Promise<CardLockResult<T>> {
    const role = this.store.roleOf(scope, boardId);
    if (!role) return { status: "board-not-found" };
    if (cardId === null) return { status: "card-not-found" };

    const previous = this.queues.get(cardId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.queues.set(cardId, previous.then(() => current));
    await previous;

    try {
      if (this.store.boardOfCard(cardId) !== boardId) return { status: "card-not-found" };
      const snapshot = new Map([...this.store.cardLabels].map(([key, row]) => [key, { ...row }]));
      const calls: string[] = [];
      this.calls.push(calls);
      try {
        return { status: "ok", value: await work(this.transaction(boardId, cardId, calls), role) };
      } catch (error) {
        this.store.cardLabels.clear();
        for (const [key, row] of snapshot) this.store.cardLabels.set(key, row);
        throw error;
      }
    } finally {
      release();
    }
  }

  private transaction(boardId: string, cardId: string, calls: string[]): CardLabelTransaction {
    const store = this.store;
    const track = (name: keyof CardLabelTransaction) => {
      calls.push(name);
      if (this.failOn === name) throw new Error(`${name} failed`);
    };
    return {
      findLabel: async (labelId) => {
        track("findLabel");
        const row = store.labels.get(labelId);
        return row && row.boardId === boardId ? { id: row.id, name: row.name, color: row.color } : null;
      },
      apply: async (labelId) => {
        track("apply");
        if (this.deleteLabelBeforeApply === labelId) store.deleteLabel(labelId);
        return store.applyLabel(cardId, labelId);
      },
      remove: async (labelId) => {
        track("remove");
        store.removeLabelFrom(cardId, labelId);
      },
      listCardLabelIds: async () => {
        track("listCardLabelIds");
        return store.cardLabelIdsOf(cardId);
      },
      listLabels: async () => {
        track("listLabels");
        return store.labelsOf(boardId);
      },
    };
  }
}
