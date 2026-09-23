import type { ChecklistItem } from "../../domain/checklist";
import type { BoardRole } from "../../domain/permissions";
import type { BoardScope } from "../../repositories/BoardRepository";
import type {
  CardLockResult,
  ChecklistChanges,
  ChecklistRepository,
  ChecklistTransaction,
} from "../../repositories/ChecklistRepository";
import type { InMemoryBoardRepository } from "./InMemoryBoardRepository";

/**
 * In-memory stand-in for runInCardLock (RF06 N133): participation check with role,
 * card resolved inside the board, one queue per card, items filtered by card,
 * UNIQUE (card_id, position) checked after each primitive, rollback on error.
 */
export class InMemoryChecklistRepository implements ChecklistRepository {
  private readonly queues = new Map<string, Promise<unknown>>();
  readonly calls: string[][] = [];
  failOn: keyof ChecklistTransaction | null = null;

  constructor(private readonly store: InMemoryBoardRepository) {}

  async withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: ChecklistTransaction, role: BoardRole) => Promise<T>,
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
      const card = this.store.cards.get(cardId);
      if (!card || this.store.lists.get(card.listId)?.boardId !== boardId) return { status: "card-not-found" };

      const snapshot = new Map([...this.store.checklistItems].map(([id, row]) => [id, { ...row }]));
      const calls: string[] = [];
      this.calls.push(calls);
      try {
        return { status: "ok", value: await work(this.transaction(cardId, calls), role) };
      } catch (error) {
        this.store.checklistItems.clear();
        for (const [id, row] of snapshot) this.store.checklistItems.set(id, row);
        throw error;
      }
    } finally {
      release();
    }
  }

  private transaction(cardId: string, calls: string[]): ChecklistTransaction {
    const store = this.store;
    const statement = <T>(name: keyof ChecklistTransaction, run: () => T): T => {
      calls.push(name);
      if (this.failOn === name) throw new Error(`${name} failed`);
      const result = run();
      const seen = new Set<string>();
      for (const item of store.checklistItems.values()) {
        const key = `${item.cardId}:${item.position}`;
        if (seen.has(key)) throw new Error(`duplicate key value violates unique constraint "UQ_checklist_items_card_position"`);
        seen.add(key);
      }
      return result;
    };
    const own = (itemId: string) => {
      const row = store.checklistItems.get(itemId);
      return row && row.cardId === cardId ? row : undefined;
    };

    return {
      count: async () => statement("count", () => store.itemsOf(cardId).length),
      nextPosition: async () =>
        statement("nextPosition", () => Math.max(0, ...store.itemsOf(cardId).map((item) => item.position)) + 1),
      insert: async (item: ChecklistItem) =>
        statement("insert", () => {
          store.checklistItems.set(item.id, { ...item, cardId });
        }),
      findItem: async (itemId) =>
        statement("findItem", () => {
          const row = own(itemId);
          return row ? { id: row.id, text: row.text, done: row.done, position: row.position } : null;
        }),
      update: async (itemId, changes: ChecklistChanges) =>
        statement("update", () => {
          const row = own(itemId);
          if (!row) return;
          if (changes.text !== undefined) row.text = changes.text;
          if (changes.done !== undefined) row.done = changes.done;
        }),
      remove: async (itemId) =>
        statement("remove", () => {
          if (own(itemId)) store.checklistItems.delete(itemId);
        }),
      listItems: async () => statement("listItems", () => store.itemsOf(cardId)),
    };
  }
}
