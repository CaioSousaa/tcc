import type { LabelView } from "../../domain/labels";
import type { BoardRole } from "../../domain/permissions";
import { UniqueConstraintError } from "../../errors/AppError";
import type { BoardScope } from "../../repositories/BoardRepository";
import type { LockResult } from "../../repositories/boardLock";
import type { LabelRecord, LabelRepository, LabelTransaction } from "../../repositories/LabelRepository";
import type { InMemoryBoardRepository } from "./InMemoryBoardRepository";

/**
 * In-memory label repository on the shared store and board lock: primitives are
 * filtered by board, the case-insensitive unique name index is enforced after each
 * write, and deleting a label cascades to its applications (RF08 N182).
 */
export class InMemoryLabelRepository implements LabelRepository {
  readonly calls: string[][] = [];
  failOn: keyof LabelTransaction | null = null;
  /** Hides duplicates from `isNameTaken` to exercise the unique index translation (F104). */
  skipNameCheck = false;

  constructor(private readonly store: InMemoryBoardRepository) {}

  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: LabelTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>> {
    return this.store.lock.run(scope, boardId, (role) => {
      const calls: string[] = [];
      this.calls.push(calls);
      return work(this.transaction(boardId, calls), role);
    });
  }

  async findLabels(scope: BoardScope, boardId: string): Promise<LabelView[] | null> {
    return this.store.roleOf(scope, boardId) ? this.store.labelsOf(boardId) : null;
  }

  private transaction(boardId: string, calls: string[]): LabelTransaction {
    const store = this.store;
    const own = (labelId: string) => {
      const row = store.labels.get(labelId);
      return row && row.boardId === boardId ? row : undefined;
    };
    const assertUniqueNames = () => {
      const seen = new Set<string>();
      for (const row of store.labels.values()) {
        const key = `${row.boardId}:${row.name.toLowerCase()}`;
        if (seen.has(key)) throw new UniqueConstraintError("UQ_labels_board_name_ci");
        seen.add(key);
      }
    };
    const statement = async <T>(name: keyof LabelTransaction, run: () => T): Promise<T> => {
      calls.push(name);
      // Yield so that concurrent callers would interleave if the lock did not serialize them.
      await Promise.resolve();
      if (this.failOn === name) throw new Error(`${name} failed`);
      return run();
    };

    return {
      count: () => statement("count", () => store.labelsOf(boardId).length),
      findLabel: (labelId) =>
        statement("findLabel", (): LabelRecord | null => {
          const row = own(labelId);
          return row ? { id: row.id, name: row.name, color: row.color } : null;
        }),
      isNameTaken: (name, exceptLabelId) =>
        statement(
          "isNameTaken",
          () =>
            !this.skipNameCheck &&
            store
              .labelsOf(boardId)
              .some((label) => label.id !== exceptLabelId && label.name.toLowerCase() === name.toLowerCase()),
        ),
      insert: (label) =>
        statement("insert", () => {
          const previous = new Map(store.labels);
          store.labels.set(label.id, { ...label, boardId, createdAt: store.now() });
          try {
            assertUniqueNames();
          } catch (error) {
            store.labels.clear();
            for (const [id, row] of previous) store.labels.set(id, row);
            throw error;
          }
        }),
      update: (labelId, changes) =>
        statement("update", () => {
          const row = own(labelId);
          if (!row) return;
          const before = { name: row.name, color: row.color };
          row.name = changes.name;
          row.color = changes.color;
          try {
            assertUniqueNames();
          } catch (error) {
            row.name = before.name;
            row.color = before.color;
            throw error;
          }
        }),
      delete: (labelId) =>
        statement("delete", () => {
          if (own(labelId)) store.deleteLabel(labelId);
        }),
      listLabels: () => statement("listLabels", () => store.labelsOf(boardId)),
    };
  }
}
