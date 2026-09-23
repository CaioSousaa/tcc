import type { ListWithCards } from "../../domain/cards";
import type { BoardRole } from "../../domain/permissions";
import type { BoardScope } from "../../repositories/BoardRepository";
import type {
  BoardListRepository,
  ListRecord,
  ListTransaction,
  LockResult,
} from "../../repositories/BoardListRepository";
import type { InMemoryBoardLock } from "./InMemoryBoardLock";
import type { InMemoryBoardRepository, ListRow } from "./InMemoryBoardRepository";

/**
 * In-memory stand-in for the locked transaction: operations on the same board
 * are serialized (shared lock), every primitive is filtered by board, and a thrown
 * error restores the previous state (rollback).
 */
export class InMemoryBoardListRepository implements BoardListRepository {
  /** Primitive calls per transaction, to assert a constant number of statements (N44). */
  readonly calls: string[][] = [];

  /** When set, the named primitive throws inside the transaction (CE03). */
  failOn: keyof ListTransaction | null = null;

  private readonly lock: InMemoryBoardLock;

  constructor(
    private readonly store: InMemoryBoardRepository,
    lock?: InMemoryBoardLock,
  ) {
    this.lock = lock ?? store.lock;
  }

  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: ListTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>> {
    return this.lock.run(scope, boardId, (role) => {
      const calls: string[] = [];
      this.calls.push(calls);
      return work(this.transaction(boardId, calls), role);
    });
  }

  private transaction(boardId: string, calls: string[]): ListTransaction {
    const store = this.store;
    const inBoard = () => [...store.lists.values()].filter((list) => list.boardId === boardId);
    const assertUniqueCardPositions = () => {
      const seen = new Set<string>();
      for (const card of store.cards.values()) {
        const key = `${card.listId}:${card.position}`;
        if (seen.has(key)) throw new Error(`duplicate key value violates unique constraint "UQ_cards_list_position" (${key})`);
        seen.add(key);
      }
    };
    const track = (name: keyof ListTransaction) => {
      calls.push(name);
      if (this.failOn === name) throw new Error(`${name} failed`);
    };

    return {
      async count() {
        track("count");
        return inBoard().length;
      },
      async findList(listId) {
        track("findList");
        const row = store.lists.get(listId);
        return row && row.boardId === boardId ? { id: row.id, name: row.name, position: row.position } : null;
      },
      async countCards(listId) {
        track("countCards");
        const row = store.lists.get(listId);
        return row && row.boardId === boardId ? store.cardsIn(listId) : 0;
      },
      async isListDeletionLocked() {
        track("isListDeletionLocked");
        return store.boards.get(boardId)?.lockListDeletion === true;
      },
      async appendCards(fromListId, toListId, offset) {
        track("appendCards");
        const from = store.lists.get(fromListId);
        const to = store.lists.get(toListId);
        if (from?.boardId !== boardId || to?.boardId !== boardId) return;
        for (const card of store.cardsOf(fromListId)) {
          card.listId = toListId;
          card.position += offset;
        }
        assertUniqueCardPositions();
      },
      async shiftRight(fromPosition) {
        track("shiftRight");
        for (const list of inBoard()) if (list.position >= fromPosition) list.position += 1;
      },
      async insert(list: ListRecord) {
        track("insert");
        const row: ListRow = { ...list, boardId, createdAt: store.now() };
        store.lists.set(list.id, row);
      },
      async rename(listId, name) {
        track("rename");
        const row = store.lists.get(listId);
        if (row && row.boardId === boardId) row.name = name;
      },
      async move(listId, from, to) {
        track("move");
        const low = Math.min(from, to);
        const high = Math.max(from, to);
        for (const list of inBoard()) {
          if (list.position < low || list.position > high) continue;
          if (list.id === listId) list.position = to;
          else list.position += to > from ? -1 : 1;
        }
      },
      async remove(listId) {
        track("remove");
        const row = store.lists.get(listId);
        if (!row || row.boardId !== boardId) return;
        store.lists.delete(listId);
        // ON DELETE CASCADE from lists to cards (RF02 D9, RF05 F54).
        for (const card of store.cardsOf(listId)) store.deleteCard(card.id);
      },
      async shiftLeft(afterPosition) {
        track("shiftLeft");
        for (const list of inBoard()) if (list.position > afterPosition) list.position -= 1;
      },
      async listAll(): Promise<ListWithCards[]> {
        track("listAll");
        return store.listsWithCards(boardId);
      },
    };
  }
}
