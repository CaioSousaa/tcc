import crypto from "node:crypto";
import { CardsService } from "./cards.service";
import { CardNotFoundError } from "./cards.errors";
import { Card } from "./entities/card.entity";
import { CardRepository, CreateCardData, UpdateCardFields } from "./repositories/repository.types";
import { List } from "../lists/entities/list.entity";
import { ListRepository } from "../lists/repositories/repository.types";
import { ListNotFoundError } from "../lists/lists.errors";
import { Board } from "../boards/entities/board.entity";
import { BoardRepository } from "../boards/repositories/repository.types";
import { BoardNotFoundError } from "../boards/boards.errors";
import { CardProgress, ChecklistRepository } from "../checklists/repositories/repository.types";
import {
  AssigneeInfo,
  CardAssignmentRepository,
} from "./repositories/card-assignment.repository.types";
import {
  CardLabelRepository,
  CreateCardLabelData,
  LabelInfo,
} from "./repositories/card-label.repository.types";
import {
  CommentRepository,
  CommentWithAuthor,
} from "./repositories/comment.repository.types";

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
    throw new Error("not used by CardsService tests");
  }

  findAllByCardWithItems(): never {
    throw new Error("not used by CardsService tests");
  }

  findChecklistByIdAndCard(): never {
    throw new Error("not used by CardsService tests");
  }

  deleteChecklist(): never {
    throw new Error("not used by CardsService tests");
  }

  createItem(): never {
    throw new Error("not used by CardsService tests");
  }

  findItemByIdAndChecklist(): never {
    throw new Error("not used by CardsService tests");
  }

  updateItemCompleted(): never {
    throw new Error("not used by CardsService tests");
  }

  deleteItem(): never {
    throw new Error("not used by CardsService tests");
  }
}

class FakeCardRepository implements CardRepository {
  readonly cards: Card[] = [];

  private byList(listId: string): Card[] {
    return this.cards.filter((c) => c.listId === listId).sort((a, b) => a.position - b.position);
  }

  async create(data: CreateCardData): Promise<Card> {
    const total = this.byList(data.listId).length;
    const card: Card = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description ?? null,
      dueDate: data.dueDate ?? null,
      listId: data.listId,
      list: undefined as unknown as Card["list"],
      position: total,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cards.push(card);
    return card;
  }

  async findAllByList(listId: string): Promise<Card[]> {
    return this.byList(listId);
  }

  async findByIdAndList(id: string, listId: string): Promise<Card | null> {
    return this.cards.find((c) => c.id === id && c.listId === listId) ?? null;
  }

  async update(id: string, listId: string, data: UpdateCardFields): Promise<Card | null> {
    const current = this.cards.find((c) => c.id === id && c.listId === listId);
    if (!current) return null;
    if (data.title !== undefined) current.title = data.title;
    if (data.description !== undefined) current.description = data.description;
    if (data.dueDate !== undefined) current.dueDate = data.dueDate;
    current.updatedAt = new Date();
    return current;
  }

  async move(
    id: string,
    fromListId: string,
    toListId: string,
    data: UpdateCardFields,
  ): Promise<Card | null> {
    const current = this.cards.find((c) => c.id === id && c.listId === fromListId);
    if (!current) return null;

    if (data.title !== undefined) current.title = data.title;
    if (data.description !== undefined) current.description = data.description;
    if (data.dueDate !== undefined) current.dueDate = data.dueDate;

    const remainingInSource = this.byList(fromListId).filter((c) => c.id !== id);
    remainingInSource.forEach((item, index) => {
      item.position = index;
    });

    const totalInTarget = this.byList(toListId).length;
    current.listId = toListId;
    current.position = totalInTarget;
    current.updatedAt = new Date();
    return current;
  }

  async delete(id: string, listId: string): Promise<boolean> {
    const index = this.cards.findIndex((c) => c.id === id && c.listId === listId);
    if (index === -1) return false;
    this.cards.splice(index, 1);
    this.byList(listId).forEach((item, i) => {
      item.position = i;
    });
    return true;
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

class FakeListRepository implements ListRepository {
  private readonly lists = new Map<string, { id: string; boardId: string }>();

  registerList(id: string, boardId: string) {
    this.lists.set(id, { id, boardId });
  }

  async findByIdAndBoard(id: string, boardId: string): Promise<List | null> {
    const list = this.lists.get(id);
    if (!list || list.boardId !== boardId) return null;
    return list as unknown as List;
  }

  async create(): Promise<List> {
    throw new Error("not used by CardsService tests");
  }

  async findAllByBoard(): Promise<List[]> {
    throw new Error("not used by CardsService tests");
  }

  async countByBoard(): Promise<number> {
    throw new Error("not used by CardsService tests");
  }

  async update(): Promise<List | null> {
    throw new Error("not used by CardsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by CardsService tests");
  }
}

class FakeBoardRepository implements BoardRepository {
  private readonly boards = new Map<string, { id: string; memberIds: Set<string> }>();

  registerBoard(id: string, owner: string) {
    this.boards.set(id, { id, memberIds: new Set([owner]) });
  }

  addMember(id: string, userId: string) {
    this.boards.get(id)?.memberIds.add(userId);
  }

  async findByIdAndMember(id: string, userId: string): Promise<Board | null> {
    const board = this.boards.get(id);
    if (!board || !board.memberIds.has(userId)) return null;
    return board as unknown as Board;
  }

  async create(): Promise<Board> {
    throw new Error("not used by CardsService tests");
  }

  async findAllByMember(): Promise<Board[]> {
    throw new Error("not used by CardsService tests");
  }

  async updateByIdAndMember(): Promise<Board | null> {
    throw new Error("not used by CardsService tests");
  }

  async deleteById(): Promise<boolean> {
    throw new Error("not used by CardsService tests");
  }
}

class FakeCardAssignmentRepository implements CardAssignmentRepository {
  create(): never {
    throw new Error("not used by CardsService tests");
  }

  async exists(): Promise<boolean> {
    return false;
  }

  async delete(): Promise<boolean> {
    return false;
  }

  async findAllByCardIds(): Promise<Record<string, AssigneeInfo[]>> {
    return {};
  }

  async deleteAllByBoardAndUser(): Promise<number> {
    return 0;
  }
}

class FakeCardLabelRepository implements CardLabelRepository {
  readonly associations: CreateCardLabelData[] = [];

  async create(data: CreateCardLabelData): Promise<never> {
    this.associations.push(data);
    return undefined as never;
  }

  async delete(): Promise<boolean> {
    return false;
  }

  async findAllByCardIds(cardIds: string[]): Promise<Record<string, LabelInfo[]>> {
    const result: Record<string, LabelInfo[]> = {};
    for (const a of this.associations) {
      if (!cardIds.includes(a.cardId)) continue;
      const list = result[a.cardId] ?? (result[a.cardId] = []);
      list.push({ id: a.labelId, name: a.labelId, color: "verde" });
    }
    return result;
  }

  async filterCardIdsByLabels(cardIds: string[], labelIds: string[]): Promise<Set<string>> {
    const matching = this.associations
      .filter((a) => cardIds.includes(a.cardId) && labelIds.includes(a.labelId))
      .map((a) => a.cardId);
    return new Set(matching);
  }
}

class FakeCommentRepository implements CommentRepository {
  readonly deletedForCards: string[][] = [];

  async create(): Promise<never> {
    throw new Error("not used by CardsService tests");
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
  const cardRepository = new FakeCardRepository();
  const listRepository = new FakeListRepository();
  const boardRepository = new FakeBoardRepository();
  const checklistRepository = new FakeChecklistRepository();
  const cardAssignmentRepository = new FakeCardAssignmentRepository();
  const cardLabelRepository = new FakeCardLabelRepository();
  const commentRepository = new FakeCommentRepository();
  const service = new CardsService(
    cardRepository,
    listRepository,
    boardRepository,
    checklistRepository,
    cardAssignmentRepository,
    cardLabelRepository,
    commentRepository,
  );
  return {
    service,
    cardRepository,
    listRepository,
    boardRepository,
    checklistRepository,
    cardAssignmentRepository,
    cardLabelRepository,
    commentRepository,
  };
}

function ownedBoardWithList(
  boardRepository: FakeBoardRepository,
  listRepository: FakeListRepository,
  owner = OWNER,
) {
  const boardId = crypto.randomUUID();
  boardRepository.registerBoard(boardId, owner);
  const listId = crypto.randomUUID();
  listRepository.registerList(listId, boardId);
  return { boardId, listId };
}

describe("CardsService.create (RN-05, RN-06, RN-07, RN-09, critérios 1, 4, 5, 6)", () => {
  it("creates a card belonging to the list (critério 1)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);

    const card = await service.create(OWNER, boardId, listId, { title: "Comprar leite" });

    expect(card.listId).toBe(listId);
    expect(card.title).toBe("Comprar leite");
  });

  it("positions a new card after all existing cards of the list (RN-09, critério 4)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);

    await service.create(OWNER, boardId, listId, { title: "A" });
    await service.create(OWNER, boardId, listId, { title: "B" });
    const third = await service.create(OWNER, boardId, listId, { title: "C" });

    expect(third.position).toBe(2);
  });

  it("creates a card without description when none is provided (critério 5)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);

    const card = await service.create(OWNER, boardId, listId, { title: "Comprar leite" });

    expect(card.description).toBeNull();
  });

  it("rejects creating a card on a board that does not exist or belongs to another user (RN-06)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { listId } = ownedBoardWithList(boardRepository, listRepository, OTHER_OWNER);

    await expect(
      service.create(OWNER, crypto.randomUUID(), crypto.randomUUID(), { title: "X" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
    await expect(
      service.create(OWNER, crypto.randomUUID(), listId, { title: "X" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("rejects creating a card on a list that does not exist in the given (accessible) board (RN-07, critério 6)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId } = ownedBoardWithList(boardRepository, listRepository);

    await expect(
      service.create(OWNER, boardId, crypto.randomUUID(), { title: "X" }),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });
});

describe("CardsService.list (RN-15, critérios 8, 9, 10)", () => {
  it("returns cards ordered by position (critério 8)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    await service.create(OWNER, boardId, listId, { title: "A" });
    await service.create(OWNER, boardId, listId, { title: "B" });

    const cards = await service.list(OWNER, boardId, listId);

    expect(cards.map((c) => c.title)).toEqual(["A", "B"]);
    expect(cards.map((c) => c.position)).toEqual([0, 1]);
  });

  it("returns an empty array for a list with no cards (RN-15, critério 9)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);

    await expect(service.list(OWNER, boardId, listId)).resolves.toEqual([]);
  });

  it("rejects listing cards of a list/board that is not accessible (critério 10)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId } = ownedBoardWithList(boardRepository, listRepository);

    await expect(
      service.list(OWNER, boardId, crypto.randomUUID()),
    ).rejects.toBeInstanceOf(ListNotFoundError);
    await expect(
      service.list(OWNER, crypto.randomUUID(), crypto.randomUUID()),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("CardsService.update — editing (RN-08, RN-16, critérios 11, 12, 14)", () => {
  it("updates the title (critério 11)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, { title: "Antigo" });

    const updated = await service.update(OWNER, boardId, listId, card.id, { title: "Novo" });

    expect(updated.title).toBe("Novo");
  });

  it("updates the description (critério 12)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, { title: "Card" });

    const updated = await service.update(OWNER, boardId, listId, card.id, {
      description: "Nova descrição",
    });

    expect(updated.description).toBe("Nova descrição");
  });

  it("leaves fields not sent unchanged, and an empty payload is a no-op (RN-16)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, {
      title: "Card",
      description: "original",
    });

    const renamed = await service.update(OWNER, boardId, listId, card.id, { title: "Renomeado" });
    expect(renamed.title).toBe("Renomeado");
    expect(renamed.description).toBe("original");

    const untouched = await service.update(OWNER, boardId, listId, card.id, {});
    expect(untouched.title).toBe("Renomeado");
    expect(untouched.description).toBe("original");
  });

  it("rejects editing a card that does not exist in the given list (RN-08, critério 14)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);

    await expect(
      service.update(OWNER, boardId, listId, crypto.randomUUID(), { title: "X" }),
    ).rejects.toBeInstanceOf(CardNotFoundError);
  });

  it("rejects editing a card that belongs to a different list of the same board (RN-08, critério 14)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId: listA } = ownedBoardWithList(boardRepository, listRepository);
    const listB = crypto.randomUUID();
    listRepository.registerList(listB, boardId);
    const cardInA = await service.create(OWNER, boardId, listA, { title: "Card" });

    await expect(
      service.update(OWNER, boardId, listB, cardInA.id, { title: "X" }),
    ).rejects.toBeInstanceOf(CardNotFoundError);
  });

  it("rejects operating on a card whose board belongs to another user (RN-06)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository, OTHER_OWNER);

    await expect(
      service.update(OWNER, boardId, listId, crypto.randomUUID(), { title: "X" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("CardsService.update — moving between lists (RN-11, RN-12, RN-13, critérios 19, 20, 21, 22, 23)", () => {
  it("moves a card to an empty list of the same board (critério 19)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId: listA } = ownedBoardWithList(boardRepository, listRepository);
    const listB = crypto.randomUUID();
    listRepository.registerList(listB, boardId);
    const card = await service.create(OWNER, boardId, listA, { title: "Card" });

    const moved = await service.update(OWNER, boardId, listA, card.id, { targetListId: listB });

    expect(moved.listId).toBe(listB);
    const sourceCards = await service.list(OWNER, boardId, listA);
    const targetCards = await service.list(OWNER, boardId, listB);
    expect(sourceCards).toEqual([]);
    expect(targetCards.map((c) => c.id)).toEqual([card.id]);
  });

  it("positions a moved card after existing cards of the destination list (critério 20)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId: listA } = ownedBoardWithList(boardRepository, listRepository);
    const listB = crypto.randomUUID();
    listRepository.registerList(listB, boardId);
    await service.create(OWNER, boardId, listB, { title: "Já existente" });
    const card = await service.create(OWNER, boardId, listA, { title: "Card" });

    const moved = await service.update(OWNER, boardId, listA, card.id, { targetListId: listB });

    expect(moved.position).toBe(1);
  });

  it("reindexes the source list after a card leaves it, preserving relative order", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId: listA } = ownedBoardWithList(boardRepository, listRepository);
    const listB = crypto.randomUUID();
    listRepository.registerList(listB, boardId);
    const a = await service.create(OWNER, boardId, listA, { title: "A" });
    await service.create(OWNER, boardId, listA, { title: "B" });
    await service.create(OWNER, boardId, listA, { title: "C" });

    await service.update(OWNER, boardId, listA, a.id, { targetListId: listB });

    const remaining = await service.list(OWNER, boardId, listA);
    expect(remaining.map((card) => card.title)).toEqual(["B", "C"]);
    expect(remaining.map((card) => card.position)).toEqual([0, 1]);
  });

  it("moving to the list the card is already in is a no-op for position, not an error (RN-13, critério 21)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, { title: "Card" });

    const result = await service.update(OWNER, boardId, listId, card.id, {
      targetListId: listId,
    });

    expect(result.listId).toBe(listId);
    expect(result.position).toBe(0);
  });

  it("allows editing title/description together with a move in the same call", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId: listA } = ownedBoardWithList(boardRepository, listRepository);
    const listB = crypto.randomUUID();
    listRepository.registerList(listB, boardId);
    const card = await service.create(OWNER, boardId, listA, { title: "Antigo" });

    const moved = await service.update(OWNER, boardId, listA, card.id, {
      title: "Novo",
      targetListId: listB,
    });

    expect(moved.title).toBe("Novo");
    expect(moved.listId).toBe(listB);
  });

  it("rejects moving to a list that does not exist or does not belong to the same board (RN-11, critério 22)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, { title: "Card" });

    await expect(
      service.update(OWNER, boardId, listId, card.id, { targetListId: crypto.randomUUID() }),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });

  it("rejects moving a card that does not exist (critério 23)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId: listA } = ownedBoardWithList(boardRepository, listRepository);
    const listB = crypto.randomUUID();
    listRepository.registerList(listB, boardId);

    await expect(
      service.update(OWNER, boardId, listA, crypto.randomUUID(), { targetListId: listB }),
    ).rejects.toBeInstanceOf(CardNotFoundError);
  });
});

describe("CardsService.remove (RN-14, RN-15, critérios 15, 16, 17, 18)", () => {
  it("cascades comment deletion when a card is removed (RF09, RN-09, critério 13)", async () => {
    const { service, boardRepository, listRepository, commentRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, { title: "Com comentários" });

    await service.remove(OWNER, boardId, listId, card.id);

    expect(commentRepository.deletedForCards).toEqual([[card.id]]);
  });

  it("deletes a card and preserves the relative order of the remaining ones (critério 15)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    await service.create(OWNER, boardId, listId, { title: "A" });
    await service.create(OWNER, boardId, listId, { title: "B" });
    const c = await service.create(OWNER, boardId, listId, { title: "C" });

    await service.remove(OWNER, boardId, listId, c.id);

    const remaining = await service.list(OWNER, boardId, listId);
    expect(remaining.map((card) => card.title)).toEqual(["A", "B"]);
    expect(remaining.map((card) => card.position)).toEqual([0, 1]);
  });

  it("deleting the only card of a list leaves it with zero cards, without error (RN-15, critério 16)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const only = await service.create(OWNER, boardId, listId, { title: "Único" });

    await service.remove(OWNER, boardId, listId, only.id);

    await expect(service.list(OWNER, boardId, listId)).resolves.toEqual([]);
  });

  it("rejects deleting a card that does not exist in the given list (critério 17)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);

    await expect(
      service.remove(OWNER, boardId, listId, crypto.randomUUID()),
    ).rejects.toBeInstanceOf(CardNotFoundError);
  });

  it("rejects a second delete attempt of the same card the same way as a never-existing one (critério 18)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, { title: "Único" });

    await service.remove(OWNER, boardId, listId, card.id);

    await expect(service.remove(OWNER, boardId, listId, card.id)).rejects.toBeInstanceOf(
      CardNotFoundError,
    );
  });
});

describe("CardsService — RN-04 (titles need not be unique)", () => {
  it("allows two cards in the same list to share a title", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);

    await service.create(OWNER, boardId, listId, { title: "Sprint" });
    const second = await service.create(OWNER, boardId, listId, { title: "Sprint" });

    expect(second.title).toBe("Sprint");
  });
});

describe("CardsService — RF07 RN-13 (acesso generalizado a qualquer membro, critério 28)", () => {
  it("allows a member who did not create the board to create and see cards, including assignees embedded via getAssigneesForCards (critério 26)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const NON_CREATOR_MEMBER = "member-2";
    boardRepository.addMember(boardId, NON_CREATOR_MEMBER);

    const card = await service.create(NON_CREATOR_MEMBER, boardId, listId, {
      title: "Feito por membro",
    });

    await expect(service.list(NON_CREATOR_MEMBER, boardId, listId)).resolves.toEqual([card]);
    await expect(service.getAssigneesForCards([card.id])).resolves.toEqual({});
  });
});

describe("CardsService.getLabelsForCards (RF08, critério 24)", () => {
  it("delegates to CardLabelRepository.findAllByCardIds, doing a single batched read", async () => {
    const { service, cardLabelRepository } = buildService();
    cardLabelRepository.associations.push({ cardId: "card-1", labelId: "label-1" });

    const labels = await service.getLabelsForCards(["card-1", "card-2"]);

    expect(labels).toEqual({ "card-1": [{ id: "label-1", name: "label-1", color: "verde" }] });
  });
});

describe("CardsService.list — filtro por etiqueta (RF08, RN-13, RN-14, RN-15, critérios 25, 26, 27, 28)", () => {
  it("returns every card when no labelIds filter is given (RN-15)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    await service.create(OWNER, boardId, listId, { title: "A" });
    await service.create(OWNER, boardId, listId, { title: "B" });

    const cards = await service.list(OWNER, boardId, listId);

    expect(cards).toHaveLength(2);
  });

  it("returns only cards that have the given label (critério 25)", async () => {
    const { service, boardRepository, listRepository, cardLabelRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const withLabel = await service.create(OWNER, boardId, listId, { title: "Com etiqueta" });
    await service.create(OWNER, boardId, listId, { title: "Sem etiqueta" });
    cardLabelRepository.associations.push({ cardId: withLabel.id, labelId: "label-x" });

    const cards = await service.list(OWNER, boardId, listId, ["label-x"]);

    expect(cards.map((c) => c.id)).toEqual([withLabel.id]);
  });

  it("returns the union of cards for more than one label, not the intersection (critério 26)", async () => {
    const { service, boardRepository, listRepository, cardLabelRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const hasX = await service.create(OWNER, boardId, listId, { title: "X" });
    const hasY = await service.create(OWNER, boardId, listId, { title: "Y" });
    const hasNeither = await service.create(OWNER, boardId, listId, { title: "Nenhuma" });
    cardLabelRepository.associations.push({ cardId: hasX.id, labelId: "label-x" });
    cardLabelRepository.associations.push({ cardId: hasY.id, labelId: "label-y" });
    void hasNeither;

    const cards = await service.list(OWNER, boardId, listId, ["label-x", "label-y"]);

    expect(cards.map((c) => c.id).sort()).toEqual([hasX.id, hasY.id].sort());
  });

  it("returns an empty list for a label with no cards, not an error (critério 28)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    await service.create(OWNER, boardId, listId, { title: "A" });

    const cards = await service.list(OWNER, boardId, listId, ["label-without-cards"]);

    expect(cards).toEqual([]);
  });

  it("treats an empty labelIds array the same as no filter (RN-15, critério 27)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    await service.create(OWNER, boardId, listId, { title: "A" });

    const cards = await service.list(OWNER, boardId, listId, []);

    expect(cards).toHaveLength(1);
  });

  it("rejects filtering cards of a board the caller is not a member of (RN-16, critério 29)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository, OTHER_OWNER);

    await expect(
      service.list(OWNER, boardId, listId, ["some-label"]),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("CardsService — prazo (RF10, RN-01, RN-03, RN-04, critérios 1, 2, 7, 8, 9)", () => {
  it("creates a card with a due date (critério 1)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);

    const card = await service.create(OWNER, boardId, listId, {
      title: "Entregar relatório",
      dueDate: "2026-03-15",
    });

    expect(card.dueDate).toBe("2026-03-15");
  });

  it("accepts a due date in the past without rejecting it (RN-03, critério 2)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);

    const card = await service.create(OWNER, boardId, listId, {
      title: "Tarefa atrasada",
      dueDate: "2020-01-01",
    });

    expect(card.dueDate).toBe("2020-01-01");
  });

  it("creates a card without a due date when none is provided", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);

    const card = await service.create(OWNER, boardId, listId, { title: "Sem prazo" });

    expect(card.dueDate).toBeNull();
  });

  it("changes an existing due date to a new one (critério 7)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, {
      title: "X",
      dueDate: "2026-01-01",
    });

    const updated = await service.update(OWNER, boardId, listId, card.id, {
      dueDate: "2026-02-01",
    });

    expect(updated.dueDate).toBe("2026-02-01");
  });

  it("removes an existing due date with null (critério 8)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, {
      title: "X",
      dueDate: "2026-01-01",
    });

    const updated = await service.update(OWNER, boardId, listId, card.id, { dueDate: null });

    expect(updated.dueDate).toBeNull();
  });

  it("leaves the due date untouched when the field is absent from the update", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, {
      title: "X",
      dueDate: "2026-01-01",
    });

    const updated = await service.update(OWNER, boardId, listId, card.id, { title: "Y" });

    expect(updated.dueDate).toBe("2026-01-01");
  });

  it("removing a due date that is already absent is idempotent, not an error (RN-04, critério 9)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const card = await service.create(OWNER, boardId, listId, { title: "Sem prazo" });

    const updated = await service.update(OWNER, boardId, listId, card.id, { dueDate: null });

    expect(updated.dueDate).toBeNull();
  });
});

describe("CardsService.list — ordenar por prazo (RF10, RN-10, RN-11, RN-12, critérios 17, 18, 19, 20)", () => {
  it("orders cards from the closest due date to the furthest (critério 17)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const far = await service.create(OWNER, boardId, listId, {
      title: "Longe",
      dueDate: "2026-06-01",
    });
    const near = await service.create(OWNER, boardId, listId, {
      title: "Perto",
      dueDate: "2026-01-10",
    });

    const cards = await service.list(OWNER, boardId, listId, undefined, true);

    expect(cards.map((c) => c.id)).toEqual([near.id, far.id]);
  });

  it("places cards without a due date after every card with one (critério 18)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const noDate = await service.create(OWNER, boardId, listId, { title: "Sem prazo" });
    const withDate = await service.create(OWNER, boardId, listId, {
      title: "Com prazo",
      dueDate: "2026-01-10",
    });

    const cards = await service.list(OWNER, boardId, listId, undefined, true);

    expect(cards.map((c) => c.id)).toEqual([withDate.id, noDate.id]);
  });

  it("preserves the prior relative order for cards that tie on due date (critério 19)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const first = await service.create(OWNER, boardId, listId, {
      title: "Primeiro",
      dueDate: "2026-01-10",
    });
    const second = await service.create(OWNER, boardId, listId, {
      title: "Segundo",
      dueDate: "2026-01-10",
    });

    const cards = await service.list(OWNER, boardId, listId, undefined, true);

    expect(cards.map((c) => c.id)).toEqual([first.id, second.id]);
  });

  it("does not change the manual order when sortByDueDate is not requested (RN-10, critério 20)", async () => {
    const { service, boardRepository, listRepository } = buildService();
    const { boardId, listId } = ownedBoardWithList(boardRepository, listRepository);
    const far = await service.create(OWNER, boardId, listId, {
      title: "Longe",
      dueDate: "2026-06-01",
    });
    const near = await service.create(OWNER, boardId, listId, {
      title: "Perto",
      dueDate: "2026-01-10",
    });

    await service.list(OWNER, boardId, listId, undefined, true);
    const manualOrder = await service.list(OWNER, boardId, listId);

    expect(manualOrder.map((c) => c.id)).toEqual([far.id, near.id]);
  });
});
