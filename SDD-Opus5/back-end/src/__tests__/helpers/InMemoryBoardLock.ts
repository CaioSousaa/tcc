import type { BoardRole } from "../../domain/permissions";
import type { BoardScope } from "../../repositories/BoardRepository";
import type { LockResult } from "../../repositories/boardLock";
import type { InMemoryBoardRepository } from "./InMemoryBoardRepository";

type Snapshot = Array<{ map: Map<string, object>; rows: Array<[string, object]> }>;

/**
 * In-memory stand-in for runInBoardLock (RF04 C67, RF07 F79): one queue per board
 * shared by every repository of the store, participation-scoped access with the
 * role read after the lock is taken, and rollback of every table when `work` throws.
 */
export class InMemoryBoardLock {
  private readonly queues = new Map<string, Promise<unknown>>();

  constructor(private readonly store: InMemoryBoardRepository) {}

  private snapshot(): Snapshot {
    const maps: Array<Map<string, object>> = [
      this.store.boards,
      this.store.lists,
      this.store.cards,
      this.store.checklistItems,
      this.store.members,
      this.store.invitations,
      this.store.assignees,
      this.store.labels,
      this.store.cardLabels,
      this.store.comments,
    ];
    return maps.map((map) => ({ map, rows: [...map].map(([id, row]): [string, object] => [id, { ...row }]) }));
  }

  private static restore(snapshot: Snapshot): void {
    for (const { map, rows } of snapshot) {
      map.clear();
      for (const [id, row] of rows) map.set(id, row);
    }
  }

  /** Serializes `work` per board without any participation check (invitation answers). */
  async runUnscoped<T>(boardId: string, work: () => Promise<T>): Promise<LockResult<T>> {
    const previous = this.queues.get(boardId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.queues.set(boardId, previous.then(() => current));
    await previous;

    try {
      if (!this.store.boards.has(boardId)) return { found: false };
      const snapshot = this.snapshot();
      try {
        return { found: true, value: await work() };
      } catch (error) {
        InMemoryBoardLock.restore(snapshot);
        throw error;
      }
    } finally {
      release();
    }
  }

  async run<T>(scope: BoardScope, boardId: string, work: (role: BoardRole) => Promise<T>): Promise<LockResult<T>> {
    let role: BoardRole | undefined;
    const result = await this.runUnscoped(boardId, async () => {
      role = this.store.roleOf(scope, boardId);
      if (!role) return undefined;
      return { value: await work(role) };
    });
    if (!result.found || !role || !result.value) return { found: false };
    return { found: true, value: result.value.value };
  }
}
