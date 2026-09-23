import type { BoardRole } from "../../domain/permissions";
import type { AssigneeRepository, AssigneeTransaction } from "../../repositories/AssigneeRepository";
import type { BoardScope } from "../../repositories/BoardRepository";
import type { CardLockResult } from "../../repositories/cardLock";
import type { InMemoryBoardRepository } from "./InMemoryBoardRepository";

/** In-memory stand-in for runInCardLock with assignee primitives and the composite foreign key (D32). */
export class InMemoryAssigneeRepository implements AssigneeRepository {
  private readonly queues = new Map<string, Promise<unknown>>();
  readonly calls: string[][] = [];

  constructor(private readonly store: InMemoryBoardRepository) {}

  async withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: AssigneeTransaction, role: BoardRole) => Promise<T>,
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
      const snapshot = new Map([...this.store.assignees].map(([key, row]) => [key, { ...row }]));
      const calls: string[] = [];
      this.calls.push(calls);
      try {
        return { status: "ok", value: await work(this.transaction(boardId, cardId, calls), role) };
      } catch (error) {
        this.store.assignees.clear();
        for (const [key, row] of snapshot) this.store.assignees.set(key, row);
        throw error;
      }
    } finally {
      release();
    }
  }

  private transaction(boardId: string, cardId: string, calls: string[]): AssigneeTransaction {
    const store = this.store;
    const track = (name: keyof AssigneeTransaction) => calls.push(name);
    return {
      isMember: async (userId) => {
        track("isMember");
        return store.member(boardId, userId) !== undefined;
      },
      assign: async (userId) => {
        track("assign");
        if (!store.member(boardId, userId)) return false;
        store.assign(cardId, userId);
        return true;
      },
      unassign: async (userId) => {
        track("unassign");
        store.unassign(cardId, userId);
      },
      listAssignees: async () => {
        track("listAssignees");
        return store.assigneesOf(cardId);
      },
    };
  }
}
