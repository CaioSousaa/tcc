import type { CardDetail } from "../../domain/cards";
import type { BoardRole } from "../../domain/permissions";
import type {
  BoardCardRepository,
  CardLocation,
  CardTransaction,
  NewCard,
} from "../../repositories/BoardCardRepository";
import type { LockResult } from "../../repositories/boardLock";
import type { BoardScope } from "../../repositories/BoardRepository";
import type { InMemoryBoardLock } from "./InMemoryBoardLock";
import type { CardRow, InMemoryBoardRepository } from "./InMemoryBoardRepository";

/**
 * In-memory card repository sharing the board lock with lists. After every
 * primitive it checks UNIQUE (list_id, position) like PostgreSQL does at the end
 * of each statement, which proves the statement order of F40 (N87).
 */
export class InMemoryBoardCardRepository implements BoardCardRepository {
  readonly calls: string[][] = [];
  failOn: keyof CardTransaction | null = null;
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
    work: (tx: CardTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>> {
    return this.lock.run(scope, boardId, (role) => {
      const calls: string[] = [];
      this.calls.push(calls);
      return work(this.transaction(boardId, calls), role);
    });
  }

  async findCard(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
  ): Promise<{ boardFound: boolean; card: CardDetail | null }> {
    if (!this.store.visible(scope, boardId)) return { boardFound: false, card: null };
    if (cardId === null) return { boardFound: true, card: null };
    const row = this.cardInBoard(boardId, cardId);
    return { boardFound: true, card: row ? toDetail(row, this.store.itemsOf(row.id), this.store.assigneesOf(row.id), this.store.cardLabelIdsOf(row.id), this.store.commentsOf(row.id)) : null };
  }

  private cardInBoard(boardId: string, cardId: string): CardRow | undefined {
    const card = this.store.cards.get(cardId);
    const list = card ? this.store.lists.get(card.listId) : undefined;
    return card && list?.boardId === boardId ? card : undefined;
  }

  private listInBoard(boardId: string, listId: string): boolean {
    return this.store.lists.get(listId)?.boardId === boardId;
  }

  private assertUniquePositions(): void {
    const seen = new Set<string>();
    for (const card of this.store.cards.values()) {
      const key = `${card.listId}:${card.position}`;
      if (seen.has(key)) throw new Error(`duplicate key value violates unique constraint "UQ_cards_list_position" (${key})`);
      seen.add(key);
    }
  }

  private transaction(boardId: string, calls: string[]): CardTransaction {
    const store = this.store;
    const statement = <T>(name: keyof CardTransaction, run: () => T): T => {
      calls.push(name);
      if (this.failOn === name) throw new Error(`${name} failed`);
      const result = run();
      this.assertUniquePositions();
      return result;
    };
    const cardsInList = (listId: string) =>
      this.listInBoard(boardId, listId) ? [...store.cards.values()].filter((card) => card.listId === listId) : [];

    return {
      findCard: async (cardId) =>
        statement("findCard", (): CardLocation | null => {
          const card = this.cardInBoard(boardId, cardId);
          return card ? { id: card.id, listId: card.listId, position: card.position, dueDate: card.dueDate } : null;
        }),
      findList: async (listId) => statement("findList", () => (this.listInBoard(boardId, listId) ? { id: listId } : null)),
      countInList: async (listId) => statement("countInList", () => cardsInList(listId).length),
      insert: async (card: NewCard) =>
        statement("insert", () => {
          if (!this.listInBoard(boardId, card.listId)) return;
          const now = store.now();
          store.cards.set(card.id, { ...card, createdAt: now, updatedAt: now, dueDate: null });
        }),
      updateContent: async (cardId, title, description, dueDate) =>
        statement("updateContent", () => {
          const card = this.cardInBoard(boardId, cardId);
          if (!card) return;
          card.title = title;
          card.description = description;
          card.dueDate = dueDate;
          card.updatedAt = store.now();
        }),
      moveWithinList: async (cardId, listId, from, to) =>
        statement("moveWithinList", () => {
          const low = Math.min(from, to);
          const high = Math.max(from, to);
          for (const card of cardsInList(listId)) {
            if (card.position < low || card.position > high) continue;
            if (card.id === cardId) card.position = to;
            else card.position += to > from ? -1 : 1;
          }
        }),
      openGap: async (listId, fromPosition) =>
        statement("openGap", () => {
          for (const card of cardsInList(listId)) if (card.position >= fromPosition) card.position += 1;
        }),
      relocate: async (cardId, toListId, toPosition) =>
        statement("relocate", () => {
          const card = this.cardInBoard(boardId, cardId);
          if (!card || !this.listInBoard(boardId, toListId)) return;
          card.listId = toListId;
          card.position = toPosition;
        }),
      closeGap: async (listId, afterPosition) =>
        statement("closeGap", () => {
          for (const card of cardsInList(listId)) if (card.position > afterPosition) card.position -= 1;
        }),
      remove: async (cardId) =>
        statement("remove", () => {
          if (this.cardInBoard(boardId, cardId)) store.deleteCard(cardId);
        }),
      listsWithCards: async (listIds) => statement("listsWithCards", () => store.listsWithCards(boardId, listIds)),
      readCard: async (cardId) =>
        statement("readCard", () => {
          const card = this.cardInBoard(boardId, cardId);
          return card ? toDetail(card, store.itemsOf(card.id), store.assigneesOf(card.id), store.cardLabelIdsOf(card.id), store.commentsOf(card.id)) : null;
        }),
    };
  }
}

function toDetail(
  row: CardRow,
  checklist: CardDetail["checklist"],
  assignees: CardDetail["assignees"],
  labelIds: CardDetail["labelIds"],
  comments: CardDetail["comments"],
): CardDetail {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    listId: row.listId,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    checklist,
    assignees,
    labelIds,
    comments,
    dueDate: row.dueDate,
  };
}
