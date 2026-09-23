import crypto from "node:crypto";
import { ListsService } from "./lists.service";
import { ListNotFoundError } from "./lists.errors";
import { List } from "./entities/list.entity";
import { CreateListData, ListRepository, UpdateListData } from "./repositories/repository.types";
import { Board } from "../boards/entities/board.entity";
import { BoardRepository } from "../boards/repositories/repository.types";
import { BoardNotFoundError } from "../boards/boards.errors";
import { ValidationError } from "../../shared/errors";
import { Card } from "../cards/entities/card.entity";
import { CardRepository, CreateCardData } from "../cards/repositories/repository.types";
import { CardProgress, ChecklistRepository } from "../checklists/repositories/repository.types";
import {
  CommentRepository,
  CommentWithAuthor,
} from "../cards/repositories/comment.repository.types";

class FakeChecklistRepository implements ChecklistRepository {
  readonly deletedForCards: string[][] = [];

  async deleteAllByCards(cardIds: string[]): Promise<number> {
    this.deletedForCards.push(cardIds);
    return 0;
  }

  async getProgressByCards(): Promise<Record<string, CardProgress>> {
    return {};
  }

  createChecklist(): never {
    throw new Error("not used by ListsService tests");
  }

  findAllByCardWithItems(): never {
    throw new Error("not used by ListsService tests");
  }

  findChecklistByIdAndCard(): never {
    throw new Error("not used by ListsService tests");
  }

  deleteChecklist(): never {
    throw new Error("not used by ListsService tests");
  }

  createItem(): never {
    throw new Error("not used by ListsService tests");
  }

  findItemByIdAndChecklist(): never {
    throw new Error("not used by ListsService tests");
  }

  updateItemCompleted(): never {
    throw new Error("not used by ListsService tests");
  }

  deleteItem(): never {
    throw new Error("not used by ListsService tests");
  }
}

class FakeListRepository implements ListRepository {
  readonly lists: List[] = [];

  private byBoard(boardId: string): List[] {
    return this.lists.filter((l) => l.boardId === boardId).sort((a, b) => a.position - b.position);
  }

  async create(data: CreateListData): Promise<List> {
    const total = this.byBoard(data.boardId).length;
    const list: List = {
      id: crypto.randomUUID(),
      name: data.name,
      boardId: data.boardId,
      board: undefined as unknown as List["board"],
      position: total,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.lists.push(list);
    return list;
  }

  async findAllByBoard(boardId: string): Promise<List[]> {
    return this.byBoard(boardId);
  }

  async findByIdAndBoard(id: string, boardId: string): Promise<List | null> {
    return this.lists.find((l) => l.id === id && l.boardId === boardId) ?? null;
  }

  async countByBoard(boardId: string): Promise<number> {
    return this.byBoard(boardId).length;
  }

  async update(id: string, boardId: string, data: UpdateListData): Promise<List | null> {
    const current = this.lists.find((l) => l.id === id && l.boardId === boardId);
    if (!current) return null;

    if (data.name !== undefined) current.name = data.name;

    if (data.position !== undefined && data.position !== current.position) {
      const siblings = this.byBoard(boardId);
      const withoutCurrent = siblings.filter((l) => l.id !== id);
      withoutCurrent.splice(data.position, 0, current);
      withoutCurrent.forEach((item, index) => {
        item.position = index;
      });
    }

    current.updatedAt = new Date();
    return current;
  }

  async delete(id: string, boardId: string): Promise<boolean> {
    const index = this.lists.findIndex((l) => l.id === id && l.boardId === boardId);
    if (index === -1) return false;
    this.lists.splice(index, 1);
    this.byBoard(boardId).forEach((item, i) => {
      item.position = i;
    });
    return true;
  }
}

class FakeBoardRepository implements BoardRepository {
  private readonly boards = new Map<string, { id: string; memberIds: Set<string> }>();

  /** Registra o quadro com `owner` como seu único membro (RF07: acesso passou de "dono" para "membro"). */
  registerBoard(id: string, owner: string) {
    this.boards.set(id, { id, memberIds: new Set([owner]) });
  }

  /** Adiciona outro membro ao quadro (RF07: qualquer membro, não só quem criou). */
  addMember(id: string, userId: string) {
    this.boards.get(id)?.memberIds.add(userId);
  }

  async findByIdAndMember(id: string, userId: string): Promise<Board | null> {
    const board = this.boards.get(id);
    if (!board || !board.memberIds.has(userId)) return null;
    return board as unknown as Board;
  }

  async create(): Promise<Board> {
    throw new Error("not used by ListsService tests");
  }

  async findAllByMember(): Promise<Board[]> {
    throw new Error("not used by ListsService tests");
  }

  async updateByIdAndMember(): Promise<Board | null> {
    throw new Error("not used by ListsService tests");
  }

  async deleteById(): Promise<boolean> {
    throw new Error("not used by ListsService tests");
  }
}

class FakeCardRepository implements CardRepository {
  readonly cards: Card[] = [];

  async create(data: CreateCardData): Promise<Card> {
    const card: Card = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description ?? null,
      listId: data.listId,
      list: undefined as unknown as Card["list"],
      position: this.cards.filter((c) => c.listId === data.listId).length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cards.push(card);
    return card;
  }

  async findAllByList(listId: string): Promise<Card[]> {
    return this.cards.filter((c) => c.listId === listId);
  }

  async findByIdAndList(id: string, listId: string): Promise<Card | null> {
    return this.cards.find((c) => c.id === id && c.listId === listId) ?? null;
  }

  async update(): Promise<Card | null> {
    throw new Error("not used by ListsService tests");
  }

  async move(): Promise<Card | null> {
    throw new Error("not used by ListsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by ListsService tests");
  }

  async deleteAllByList(listId: string): Promise<number> {
    const before = this.cards.length;
    for (let i = this.cards.length - 1; i >= 0; i -= 1) {
      if (this.cards[i]?.listId === listId) {
        this.cards.splice(i, 1);
      }
    }
    return before - this.cards.length;
  }
}

class FakeCommentRepository implements CommentRepository {
  readonly deletedForCards: string[][] = [];

  async create(): Promise<never> {
    throw new Error("not used by ListsService tests");
  }

  async findAllByCardWithAuthor(): Promise<CommentWithAuthor[]> {
    return [];
  }

  async deleteAllByCards(cardIds: string[]): Promise<number> {
    this.deletedForCards.push(cardIds);
    return 0;
  }
}

const OWNER = "owner-1";
const OTHER_OWNER = "owner-2";

function buildService() {
  const listRepository = new FakeListRepository();
  const boardRepository = new FakeBoardRepository();
  const cardRepository = new FakeCardRepository();
  const checklistRepository = new FakeChecklistRepository();
  const commentRepository = new FakeCommentRepository();
  const service = new ListsService(
    listRepository,
    boardRepository,
    cardRepository,
    checklistRepository,
    commentRepository,
  );
  return {
    service,
    listRepository,
    boardRepository,
    cardRepository,
    checklistRepository,
    commentRepository,
  };
}

function ownedBoard(boardRepository: FakeBoardRepository, owner = OWNER): string {
  const boardId = crypto.randomUUID();
  boardRepository.registerBoard(boardId, owner);
  return boardId;
}

describe("ListsService.create (RN-04, RN-05, RN-08, critérios 1, 4, 5)", () => {
  it("creates a list belonging to the board (critério 1)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);

    const list = await service.create(OWNER, boardId, { name: "A Fazer" });

    expect(list.boardId).toBe(boardId);
    expect(list.name).toBe("A Fazer");
  });

  it("positions a new list after all existing lists of the board (RN-08, critério 4)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);

    await service.create(OWNER, boardId, { name: "A Fazer" });
    await service.create(OWNER, boardId, { name: "Em Progresso" });
    const third = await service.create(OWNER, boardId, { name: "Feito" });

    expect(third.position).toBe(2);
  });

  it("rejects creating a list on a board that does not exist or belongs to another user (RN-05, critério 5)", async () => {
    const { service, boardRepository } = buildService();
    const foreignBoardId = ownedBoard(boardRepository, OTHER_OWNER);

    await expect(
      service.create(OWNER, crypto.randomUUID(), { name: "A Fazer" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
    await expect(
      service.create(OWNER, foreignBoardId, { name: "A Fazer" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("ListsService.list (RN-11, critérios 7, 8, 9)", () => {
  it("returns lists ordered by position (critério 7)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    await service.create(OWNER, boardId, { name: "A Fazer" });
    await service.create(OWNER, boardId, { name: "Em Progresso" });

    const lists = await service.list(OWNER, boardId);

    expect(lists.map((l) => l.name)).toEqual(["A Fazer", "Em Progresso"]);
    expect(lists.map((l) => l.position)).toEqual([0, 1]);
  });

  it("returns an empty array for a board with no lists (RN-11, critério 8)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);

    await expect(service.list(OWNER, boardId)).resolves.toEqual([]);
  });

  it("rejects listing lists of a board that does not exist or belongs to another user (critério 9)", async () => {
    const { service, boardRepository } = buildService();
    const foreignBoardId = ownedBoard(boardRepository, OTHER_OWNER);

    await expect(service.list(OWNER, foreignBoardId)).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("ListsService.update — rename (critérios 10, 12)", () => {
  it("updates the name (critério 10)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const list = await service.create(OWNER, boardId, { name: "Antigo nome" });

    const updated = await service.update(OWNER, boardId, list.id, { name: "Novo nome" });

    expect(updated.name).toBe("Novo nome");
  });

  it("rejects renaming a list that does not exist in the given board (RN-06, critério 12)", async () => {
    const { service, boardRepository } = buildService();
    const boardA = ownedBoard(boardRepository);
    const boardB = ownedBoard(boardRepository);
    const listOfBoardA = await service.create(OWNER, boardA, { name: "Lista" });

    await expect(
      service.update(OWNER, boardA, crypto.randomUUID(), { name: "X" }),
    ).rejects.toBeInstanceOf(ListNotFoundError);
    await expect(
      service.update(OWNER, boardB, listOfBoardA.id, { name: "X" }),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });

  it("rejects operating on a list whose board belongs to another user (RN-05, RN-06)", async () => {
    const { service, boardRepository } = buildService();
    const foreignBoardId = ownedBoard(boardRepository, OTHER_OWNER);

    await expect(
      service.update(OWNER, foreignBoardId, crypto.randomUUID(), { name: "X" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("ListsService.update — reorder (RN-07, RN-09, critérios 13, 14, 15, 16, 17)", () => {
  async function buildBoardWithThreeLists() {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const a = await service.create(OWNER, boardId, { name: "A" });
    const b = await service.create(OWNER, boardId, { name: "B" });
    const c = await service.create(OWNER, boardId, { name: "C" });
    return { service, boardId, a, b, c };
  }

  it("moves a list to a different valid position, preserving relative order of the rest (critério 13)", async () => {
    const { service, boardId, c } = await buildBoardWithThreeLists();

    await service.update(OWNER, boardId, c.id, { position: 1 });

    const names = (await service.list(OWNER, boardId)).map((l) => l.name);
    expect(names).toEqual(["A", "C", "B"]);
  });

  it("moving to position 0 puts the list before all others (critério 14)", async () => {
    const { service, boardId, c } = await buildBoardWithThreeLists();

    await service.update(OWNER, boardId, c.id, { position: 0 });

    const names = (await service.list(OWNER, boardId)).map((l) => l.name);
    expect(names).toEqual(["C", "A", "B"]);
  });

  it("moving to the last position puts the list after all others (critério 15)", async () => {
    const { service, boardId, a } = await buildBoardWithThreeLists();

    await service.update(OWNER, boardId, a.id, { position: 2 });

    const names = (await service.list(OWNER, boardId)).map((l) => l.name);
    expect(names).toEqual(["B", "C", "A"]);
  });

  it("keeps positions contiguous (0..n-1) after a move (RN-07)", async () => {
    const { service, boardId, a } = await buildBoardWithThreeLists();

    await service.update(OWNER, boardId, a.id, { position: 2 });

    const positions = (await service.list(OWNER, boardId)).map((l) => l.position);
    expect(positions).toEqual([0, 1, 2]);
  });

  it("rejects moving a list to a position beyond the last valid index (RN-09, critério 16)", async () => {
    const { service, boardId, a } = await buildBoardWithThreeLists();

    await expect(
      service.update(OWNER, boardId, a.id, { position: 3 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects reordering a list that does not exist in the given board (critério 17)", async () => {
    const { service, boardId } = await buildBoardWithThreeLists();

    await expect(
      service.update(OWNER, boardId, crypto.randomUUID(), { position: 0 }),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });
});

describe("ListsService.remove (RN-07, RN-10, RN-11, critérios 18, 19, 20, 21)", () => {
  it("deletes a list and preserves the relative order of the remaining ones (critério 18)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    await service.create(OWNER, boardId, { name: "A" });
    await service.create(OWNER, boardId, { name: "B" });
    const c = await service.create(OWNER, boardId, { name: "C" });

    await service.remove(OWNER, boardId, c.id);

    const remaining = await service.list(OWNER, boardId);
    expect(remaining.map((l) => l.name)).toEqual(["A", "B"]);
    expect(remaining.map((l) => l.position)).toEqual([0, 1]);
  });

  it("deleting the only list of a board leaves it with zero lists, without error (RN-11, critério 19)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const only = await service.create(OWNER, boardId, { name: "Única" });

    await service.remove(OWNER, boardId, only.id);

    await expect(service.list(OWNER, boardId)).resolves.toEqual([]);
  });

  it("rejects deleting a list that does not exist in the given board (critério 20)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);

    await expect(
      service.remove(OWNER, boardId, crypto.randomUUID()),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });

  it("rejects a second delete attempt of the same list the same way as a never-existing one (critério 21)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const list = await service.create(OWNER, boardId, { name: "Única" });

    await service.remove(OWNER, boardId, list.id);

    await expect(service.remove(OWNER, boardId, list.id)).rejects.toBeInstanceOf(
      ListNotFoundError,
    );
  });
});

describe("ListsService.remove — cascade delete of cards (RF05, RN-01, RN-02, critérios 1, 3, 6)", () => {
  it("deletes all cards belonging to the list along with it (critério 3, RN-01, RN-02)", async () => {
    const { service, boardRepository, cardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const list = await service.create(OWNER, boardId, { name: "Lista com cards" });
    await cardRepository.create({ listId: list.id, title: "Card 1" });
    await cardRepository.create({ listId: list.id, title: "Card 2" });

    await service.remove(OWNER, boardId, list.id);

    await expect(cardRepository.findAllByList(list.id)).resolves.toEqual([]);
  });

  it("cascades comment deletion for every card of the removed list, extending RF09 RN-09 through the RF05 list→card cascade", async () => {
    const { service, boardRepository, cardRepository, commentRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const list = await service.create(OWNER, boardId, { name: "Lista com cards" });
    const card1 = await cardRepository.create({ listId: list.id, title: "Card 1" });
    const card2 = await cardRepository.create({ listId: list.id, title: "Card 2" });

    await service.remove(OWNER, boardId, list.id);

    expect(commentRepository.deletedForCards).toEqual([[card1.id, card2.id]]);
  });

  it("succeeds without touching cards when the list has none (critério 1)", async () => {
    const { service, boardRepository, cardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const list = await service.create(OWNER, boardId, { name: "Lista vazia" });

    await service.remove(OWNER, boardId, list.id);

    await expect(cardRepository.findAllByList(list.id)).resolves.toEqual([]);
  });

  it("does not affect cards belonging to other lists of the same board", async () => {
    const { service, boardRepository, cardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const toDelete = await service.create(OWNER, boardId, { name: "Vai sumir" });
    const toKeep = await service.create(OWNER, boardId, { name: "Fica" });
    await cardRepository.create({ listId: toDelete.id, title: "Some junto" });
    const survivor = await cardRepository.create({ listId: toKeep.id, title: "Sobrevive" });

    await service.remove(OWNER, boardId, toDelete.id);

    const remaining = await cardRepository.findAllByList(toKeep.id);
    expect(remaining.map((c) => c.id)).toEqual([survivor.id]);
  });

  it("deleting the last list of a board removes its cards too, leaving zero lists and zero cards (critério 6)", async () => {
    const { service, boardRepository, cardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const only = await service.create(OWNER, boardId, { name: "Única" });
    await cardRepository.create({ listId: only.id, title: "Card" });

    await service.remove(OWNER, boardId, only.id);

    await expect(service.list(OWNER, boardId)).resolves.toEqual([]);
    await expect(cardRepository.findAllByList(only.id)).resolves.toEqual([]);
  });

  it("does not delete cards when the list does not belong to the given board", async () => {
    const { service, boardRepository, cardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const otherBoardId = ownedBoard(boardRepository);
    const listInOtherBoard = await service.create(OWNER, otherBoardId, {
      name: "De outro quadro",
    });
    await cardRepository.create({ listId: listInOtherBoard.id, title: "Intacto" });

    await expect(
      service.remove(OWNER, boardId, listInOtherBoard.id),
    ).rejects.toBeInstanceOf(ListNotFoundError);

    await expect(cardRepository.findAllByList(listInOtherBoard.id)).resolves.toHaveLength(1);
  });
});

describe("ListsService — RN-03 (names need not be unique)", () => {
  it("allows two lists in the same board to share a name", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);

    await service.create(OWNER, boardId, { name: "Sprint" });
    const second = await service.create(OWNER, boardId, { name: "Sprint" });

    expect(second.name).toBe("Sprint");
  });
});

describe("ListsService — RF07 RN-13 (acesso generalizado a qualquer membro, critério 28)", () => {
  it("allows a member who did not create the board to create and list its lists", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository, OWNER);
    const NON_CREATOR_MEMBER = "member-2";
    boardRepository.addMember(boardId, NON_CREATOR_MEMBER);

    const list = await service.create(NON_CREATOR_MEMBER, boardId, { name: "Feita por membro" });

    expect(list.boardId).toBe(boardId);
    await expect(service.list(NON_CREATOR_MEMBER, boardId)).resolves.toHaveLength(1);
  });
});
