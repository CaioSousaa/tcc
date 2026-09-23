import crypto from "node:crypto";
import { ListsService } from "./lists.service";
import { CardsService } from "../cards/cards.service";
import { ListNotFoundError } from "./lists.errors";
import { CardNotFoundError } from "../cards/cards.errors";
import { List } from "./entities/list.entity";
import { Board } from "../boards/entities/board.entity";
import { Card } from "../cards/entities/card.entity";
import { BoardRepository } from "../boards/repositories/repository.types";
import {
  CreateListData,
  ListRepository,
  UpdateListData,
} from "./repositories/repository.types";
import {
  CardRepository,
  CreateCardData,
  UpdateCardFields,
} from "../cards/repositories/repository.types";
import { CardProgress, ChecklistRepository } from "../checklists/repositories/repository.types";
import {
  AssigneeInfo,
  CardAssignmentRepository,
} from "../cards/repositories/card-assignment.repository.types";
import {
  CardLabelRepository,
  LabelInfo,
} from "../cards/repositories/card-label.repository.types";
import {
  CommentRepository,
  CommentWithAuthor,
} from "../cards/repositories/comment.repository.types";

class FakeChecklistRepository implements ChecklistRepository {
  async deleteAllByCards(): Promise<number> {
    return 0;
  }

  async getProgressByCards(): Promise<Record<string, CardProgress>> {
    return {};
  }

  createChecklist(): never {
    throw new Error("not used in this test");
  }

  findAllByCardWithItems(): never {
    throw new Error("not used in this test");
  }

  findChecklistByIdAndCard(): never {
    throw new Error("not used in this test");
  }

  deleteChecklist(): never {
    throw new Error("not used in this test");
  }

  createItem(): never {
    throw new Error("not used in this test");
  }

  findItemByIdAndChecklist(): never {
    throw new Error("not used in this test");
  }

  updateItemCompleted(): never {
    throw new Error("not used in this test");
  }

  deleteItem(): never {
    throw new Error("not used in this test");
  }
}

class FakeBoardRepository implements BoardRepository {
  private readonly boards = new Map<string, { id: string; memberIds: Set<string> }>();

  registerBoard(id: string, owner: string) {
    this.boards.set(id, { id, memberIds: new Set([owner]) });
  }

  async findByIdAndMember(id: string, userId: string): Promise<Board | null> {
    const board = this.boards.get(id);
    if (!board || !board.memberIds.has(userId)) return null;
    return board as unknown as Board;
  }

  async create(): Promise<Board> {
    throw new Error("not used in this test");
  }

  async findAllByMember(): Promise<Board[]> {
    throw new Error("not used in this test");
  }

  async updateByIdAndMember(): Promise<Board | null> {
    throw new Error("not used in this test");
  }

  async deleteById(): Promise<boolean> {
    throw new Error("not used in this test");
  }
}

class FakeCardAssignmentRepository implements CardAssignmentRepository {
  create(): never {
    throw new Error("not used in this test");
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
  create(): never {
    throw new Error("not used in this test");
  }

  async delete(): Promise<boolean> {
    return false;
  }

  async findAllByCardIds(): Promise<Record<string, LabelInfo[]>> {
    return {};
  }

  async filterCardIdsByLabels(): Promise<Set<string>> {
    return new Set();
  }
}

class FakeCommentRepository implements CommentRepository {
  create(): never {
    throw new Error("not used in this test");
  }

  async findAllByCardWithAuthor(): Promise<CommentWithAuthor[]> {
    return [];
  }

  async deleteAllByCards(): Promise<number> {
    return 0;
  }
}

class FakeListRepository implements ListRepository {
  readonly lists: List[] = [];

  async create(data: CreateListData): Promise<List> {
    const total = this.lists.filter((l) => l.boardId === data.boardId).length;
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
    return this.lists.filter((l) => l.boardId === boardId);
  }

  async findByIdAndBoard(id: string, boardId: string): Promise<List | null> {
    return this.lists.find((l) => l.id === id && l.boardId === boardId) ?? null;
  }

  async countByBoard(boardId: string): Promise<number> {
    return this.lists.filter((l) => l.boardId === boardId).length;
  }

  async update(): Promise<List | null> {
    throw new Error("not used in this test");
  }

  async delete(id: string, boardId: string): Promise<boolean> {
    const index = this.lists.findIndex((l) => l.id === id && l.boardId === boardId);
    if (index === -1) return false;
    this.lists.splice(index, 1);
    return true;
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

  async update(id: string, listId: string, data: UpdateCardFields): Promise<Card | null> {
    const current = this.cards.find((c) => c.id === id && c.listId === listId);
    if (!current) return null;
    if (data.title !== undefined) current.title = data.title;
    if (data.description !== undefined) current.description = data.description;
    return current;
  }

  async move(): Promise<Card | null> {
    throw new Error("not used in this test");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used in this test");
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

const OWNER = "owner-1";

function build() {
  const boardRepository = new FakeBoardRepository();
  const listRepository = new FakeListRepository();
  const cardRepository = new FakeCardRepository();
  const checklistRepository = new FakeChecklistRepository();
  const cardAssignmentRepository = new FakeCardAssignmentRepository();
  const cardLabelRepository = new FakeCardLabelRepository();
  const commentRepository = new FakeCommentRepository();
  const listsService = new ListsService(
    listRepository,
    boardRepository,
    cardRepository,
    checklistRepository,
    commentRepository,
  );
  const cardsService = new CardsService(
    cardRepository,
    listRepository,
    boardRepository,
    checklistRepository,
    cardAssignmentRepository,
    cardLabelRepository,
    commentRepository,
  );
  return { listsService, cardsService, boardRepository };
}

function ownedBoard(boardRepository: FakeBoardRepository): string {
  const boardId = crypto.randomUUID();
  boardRepository.registerBoard(boardId, OWNER);
  return boardId;
}

describe("Cascata RF05 observada a partir de CardsService (critério 5, RN-06/RN-07 de RF04)", () => {
  it("acessar um card pela mesma URL (boardId + listId originais) após a lista ser excluída retorna 'lista não encontrada'", async () => {
    const { listsService, cardsService, boardRepository } = build();
    const boardId = ownedBoard(boardRepository);
    const list = await listsService.create(OWNER, boardId, { name: "Lista" });
    const card = await cardsService.create(OWNER, boardId, list.id, { title: "Card" });

    await listsService.remove(OWNER, boardId, list.id);

    await expect(
      cardsService.update(OWNER, boardId, list.id, card.id, { title: "X" }),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });

  it("o card deixou mesmo de existir: referenciado a partir de uma lista ainda válida do mesmo quadro, o card não é encontrado nela", async () => {
    const { listsService, cardsService, boardRepository } = build();
    const boardId = ownedBoard(boardRepository);
    const list = await listsService.create(OWNER, boardId, { name: "Vai sumir" });
    const survivorList = await listsService.create(OWNER, boardId, { name: "Fica" });
    const card = await cardsService.create(OWNER, boardId, list.id, { title: "Card" });

    await listsService.remove(OWNER, boardId, list.id);

    await expect(
      cardsService.update(OWNER, boardId, survivorList.id, card.id, { title: "X" }),
    ).rejects.toBeInstanceOf(CardNotFoundError);
  });
});
