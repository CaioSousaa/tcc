import crypto from "node:crypto";
import { ChecklistsService } from "./checklists.service";
import { ChecklistNotFoundError, ItemNotFoundError } from "./checklists.errors";
import { Checklist } from "./entities/checklist.entity";
import { ChecklistItem } from "./entities/checklist-item.entity";
import {
  CardProgress,
  ChecklistRepository,
  ChecklistWithItems,
  CreateChecklistData,
  CreateItemData,
} from "./repositories/repository.types";
import { Card } from "../cards/entities/card.entity";
import { CardRepository } from "../cards/repositories/repository.types";
import { CardNotFoundError } from "../cards/cards.errors";
import { List } from "../lists/entities/list.entity";
import { ListRepository } from "../lists/repositories/repository.types";
import { ListNotFoundError } from "../lists/lists.errors";
import { Board } from "../boards/entities/board.entity";
import { BoardRepository } from "../boards/repositories/repository.types";
import { BoardNotFoundError } from "../boards/boards.errors";

class FakeChecklistRepository implements ChecklistRepository {
  readonly checklists: Checklist[] = [];
  readonly items: ChecklistItem[] = [];

  async createChecklist(data: CreateChecklistData): Promise<Checklist> {
    const checklist: Checklist = {
      id: crypto.randomUUID(),
      name: data.name,
      cardId: data.cardId,
      card: undefined as unknown as Checklist["card"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.checklists.push(checklist);
    return checklist;
  }

  async findAllByCardWithItems(cardId: string): Promise<ChecklistWithItems[]> {
    return this.checklists
      .filter((c) => c.cardId === cardId)
      .map((checklist) => ({
        ...checklist,
        items: this.items.filter((i) => i.checklistId === checklist.id),
      }));
  }

  async findChecklistByIdAndCard(id: string, cardId: string): Promise<Checklist | null> {
    return this.checklists.find((c) => c.id === id && c.cardId === cardId) ?? null;
  }

  async deleteChecklist(id: string, cardId: string): Promise<boolean> {
    const index = this.checklists.findIndex((c) => c.id === id && c.cardId === cardId);
    if (index === -1) return false;
    this.checklists.splice(index, 1);
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      if (this.items[i]?.checklistId === id) {
        this.items.splice(i, 1);
      }
    }
    return true;
  }

  async deleteAllByCards(cardIds: string[]): Promise<number> {
    const toDelete = this.checklists.filter((c) => cardIds.includes(c.cardId));
    for (const checklist of toDelete) {
      await this.deleteChecklist(checklist.id, checklist.cardId);
    }
    return toDelete.length;
  }

  async createItem(data: CreateItemData): Promise<ChecklistItem> {
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      text: data.text,
      completed: false,
      checklistId: data.checklistId,
      checklist: undefined as unknown as ChecklistItem["checklist"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  async findItemByIdAndChecklist(id: string, checklistId: string): Promise<ChecklistItem | null> {
    return this.items.find((i) => i.id === id && i.checklistId === checklistId) ?? null;
  }

  async updateItemCompleted(
    id: string,
    checklistId: string,
    completed: boolean,
  ): Promise<ChecklistItem | null> {
    const item = this.items.find((i) => i.id === id && i.checklistId === checklistId);
    if (!item) return null;
    item.completed = completed;
    return item;
  }

  async deleteItem(id: string, checklistId: string): Promise<boolean> {
    const index = this.items.findIndex((i) => i.id === id && i.checklistId === checklistId);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }

  async getProgressByCards(cardIds: string[]): Promise<Record<string, CardProgress>> {
    const progress: Record<string, CardProgress> = {};
    for (const cardId of cardIds) {
      const checklistIds = this.checklists.filter((c) => c.cardId === cardId).map((c) => c.id);
      const items = this.items.filter((i) => checklistIds.includes(i.checklistId));
      if (items.length === 0) continue;
      progress[cardId] = {
        total: items.length,
        completed: items.filter((i) => i.completed).length,
      };
    }
    return progress;
  }
}

class FakeCardRepository implements CardRepository {
  private readonly cards = new Map<string, { id: string; listId: string }>();

  registerCard(id: string, listId: string) {
    this.cards.set(id, { id, listId });
  }

  async findByIdAndList(id: string, listId: string): Promise<Card | null> {
    const card = this.cards.get(id);
    if (!card || card.listId !== listId) return null;
    return card as unknown as Card;
  }

  async create(): Promise<Card> {
    throw new Error("not used by ChecklistsService tests");
  }

  async findAllByList(): Promise<Card[]> {
    throw new Error("not used by ChecklistsService tests");
  }

  async update(): Promise<Card | null> {
    throw new Error("not used by ChecklistsService tests");
  }

  async move(): Promise<Card | null> {
    throw new Error("not used by ChecklistsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by ChecklistsService tests");
  }

  async deleteAllByList(): Promise<number> {
    throw new Error("not used by ChecklistsService tests");
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
    throw new Error("not used by ChecklistsService tests");
  }

  async findAllByBoard(): Promise<List[]> {
    throw new Error("not used by ChecklistsService tests");
  }

  async countByBoard(): Promise<number> {
    throw new Error("not used by ChecklistsService tests");
  }

  async update(): Promise<List | null> {
    throw new Error("not used by ChecklistsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by ChecklistsService tests");
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
    throw new Error("not used by ChecklistsService tests");
  }

  async findAllByMember(): Promise<Board[]> {
    throw new Error("not used by ChecklistsService tests");
  }

  async updateByIdAndMember(): Promise<Board | null> {
    throw new Error("not used by ChecklistsService tests");
  }

  async deleteById(): Promise<boolean> {
    throw new Error("not used by ChecklistsService tests");
  }
}

const OWNER = "owner-1";
const OTHER_OWNER = "owner-2";

function buildService() {
  const checklistRepository = new FakeChecklistRepository();
  const cardRepository = new FakeCardRepository();
  const listRepository = new FakeListRepository();
  const boardRepository = new FakeBoardRepository();
  const service = new ChecklistsService(
    checklistRepository,
    cardRepository,
    listRepository,
    boardRepository,
  );
  return { service, checklistRepository, cardRepository, listRepository, boardRepository };
}

function ownedCard(
  boardRepository: FakeBoardRepository,
  listRepository: FakeListRepository,
  cardRepository: FakeCardRepository,
  owner = OWNER,
) {
  const boardId = crypto.randomUUID();
  boardRepository.registerBoard(boardId, owner);
  const listId = crypto.randomUUID();
  listRepository.registerList(listId, boardId);
  const cardId = crypto.randomUUID();
  cardRepository.registerCard(cardId, listId);
  return { boardId, listId, cardId };
}

describe("ChecklistsService.createChecklist (RN-01, RN-06, RN-09, RN-10, critérios 1, 4, 5)", () => {
  it("creates a checklist belonging to the card, with no items (critério 1)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);

    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "A Fazer",
    });

    expect(checklist.cardId).toBe(cardId);
    expect(checklist.name).toBe("A Fazer");
  });

  it("allows a card to have more than one checklist (RN-06, critério 4)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);

    await service.createChecklist(OWNER, boardId, listId, cardId, { name: "Primeiro" });
    await service.createChecklist(OWNER, boardId, listId, cardId, { name: "Segundo" });

    const checklists = await service.listChecklists(OWNER, boardId, listId, cardId);
    expect(checklists.map((c) => c.name)).toEqual(["Primeiro", "Segundo"]);
  });

  it("rejects when the board does not exist or belongs to another user (RN-10, critério 5)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository, OTHER_OWNER);

    await expect(
      service.createChecklist(OWNER, crypto.randomUUID(), listId, cardId, { name: "X" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("rejects when the list does not exist in the given board (RN-10, critério 5)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);

    await expect(
      service.createChecklist(OWNER, boardId, crypto.randomUUID(), cardId, { name: "X" }),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });

  it("rejects when the card does not exist in the given list (RN-10, critério 5)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId } = ownedCard(boardRepository, listRepository, cardRepository);

    await expect(
      service.createChecklist(OWNER, boardId, listId, crypto.randomUUID(), { name: "X" }),
    ).rejects.toBeInstanceOf(CardNotFoundError);
  });
});

describe("ChecklistsService.listChecklists (RN-14, critério 1)", () => {
  it("returns checklists with nested items, ordered by creation (RN-14)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });
    await service.createItem(OWNER, boardId, listId, cardId, checklist.id, { text: "Item 1" });
    await service.createItem(OWNER, boardId, listId, cardId, checklist.id, { text: "Item 2" });

    const checklists = await service.listChecklists(OWNER, boardId, listId, cardId);

    expect(checklists).toHaveLength(1);
    expect(checklists[0]?.items.map((i) => i.text)).toEqual(["Item 1", "Item 2"]);
  });

  it("returns an empty array for a card with no checklists", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);

    await expect(service.listChecklists(OWNER, boardId, listId, cardId)).resolves.toEqual([]);
  });
});

describe("ChecklistsService.createItem (RN-05, RN-11, critérios 7, 10)", () => {
  it("adds an item that starts as not completed (RN-05, critério 7)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });

    const item = await service.createItem(OWNER, boardId, listId, cardId, checklist.id, {
      text: "Comprar leite",
    });

    expect(item.completed).toBe(false);
    expect(item.checklistId).toBe(checklist.id);
  });

  it("rejects adding an item to a checklist that does not exist in the given card (RN-11, critério 10)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);

    await expect(
      service.createItem(OWNER, boardId, listId, cardId, crypto.randomUUID(), { text: "X" }),
    ).rejects.toBeInstanceOf(ChecklistNotFoundError);
  });

  it("rejects adding an item to a checklist that belongs to a different card (RN-11)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId: cardA } = ownedCard(boardRepository, listRepository, cardRepository);
    const cardB = crypto.randomUUID();
    cardRepository.registerCard(cardB, listId);
    const checklistOfA = await service.createChecklist(OWNER, boardId, listId, cardA, {
      name: "Lista de A",
    });

    await expect(
      service.createItem(OWNER, boardId, listId, cardB, checklistOfA.id, { text: "X" }),
    ).rejects.toBeInstanceOf(ChecklistNotFoundError);
  });
});

describe("ChecklistsService.updateItem — marcar/desmarcar (RN-12, critérios 12, 13, 14)", () => {
  it("marks an item as completed (critério 12)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });
    const item = await service.createItem(OWNER, boardId, listId, cardId, checklist.id, {
      text: "Item",
    });

    const updated = await service.updateItem(
      OWNER,
      boardId,
      listId,
      cardId,
      checklist.id,
      item.id,
      { completed: true },
    );

    expect(updated.completed).toBe(true);
  });

  it("unmarks a completed item (critério 13)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });
    const item = await service.createItem(OWNER, boardId, listId, cardId, checklist.id, {
      text: "Item",
    });
    await service.updateItem(OWNER, boardId, listId, cardId, checklist.id, item.id, {
      completed: true,
    });

    const updated = await service.updateItem(
      OWNER,
      boardId,
      listId,
      cardId,
      checklist.id,
      item.id,
      { completed: false },
    );

    expect(updated.completed).toBe(false);
  });

  it("rejects marking an item that does not exist in the given checklist (RN-12, critério 14)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });

    await expect(
      service.updateItem(OWNER, boardId, listId, cardId, checklist.id, crypto.randomUUID(), {
        completed: true,
      }),
    ).rejects.toBeInstanceOf(ItemNotFoundError);
  });

  it("rejects marking an item that belongs to a different checklist (RN-12, critério 14)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklistA = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "A",
    });
    const checklistB = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "B",
    });
    const itemOfA = await service.createItem(OWNER, boardId, listId, cardId, checklistA.id, {
      text: "Item de A",
    });

    await expect(
      service.updateItem(OWNER, boardId, listId, cardId, checklistB.id, itemOfA.id, {
        completed: true,
      }),
    ).rejects.toBeInstanceOf(ItemNotFoundError);
  });
});

describe("ChecklistsService.deleteItem (RN-16, critérios 21, 22)", () => {
  it("deletes an item (critério 21)", async () => {
    const { service, boardRepository, listRepository, cardRepository, checklistRepository } =
      buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });
    const item = await service.createItem(OWNER, boardId, listId, cardId, checklist.id, {
      text: "Item",
    });

    await service.deleteItem(OWNER, boardId, listId, cardId, checklist.id, item.id);

    expect(checklistRepository.items).toHaveLength(0);
  });

  it("rejects deleting an item that does not exist in the given checklist (critério 22)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });

    await expect(
      service.deleteItem(OWNER, boardId, listId, cardId, checklist.id, crypto.randomUUID()),
    ).rejects.toBeInstanceOf(ItemNotFoundError);
  });

  it("rejects deleting an item that belongs to a different checklist (RN-12, critério 22)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklistA = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "A",
    });
    const checklistB = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "B",
    });
    const itemOfA = await service.createItem(OWNER, boardId, listId, cardId, checklistA.id, {
      text: "Item de A",
    });

    await expect(
      service.deleteItem(OWNER, boardId, listId, cardId, checklistB.id, itemOfA.id),
    ).rejects.toBeInstanceOf(ItemNotFoundError);
  });

  it("rejects a second delete attempt of the same item (idempotência de erro)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });
    const item = await service.createItem(OWNER, boardId, listId, cardId, checklist.id, {
      text: "Item",
    });

    await service.deleteItem(OWNER, boardId, listId, cardId, checklist.id, item.id);

    await expect(
      service.deleteItem(OWNER, boardId, listId, cardId, checklist.id, item.id),
    ).rejects.toBeInstanceOf(ItemNotFoundError);
  });
});

describe("ChecklistsService.deleteChecklist (RN-15, RN-16, critérios 23, 24)", () => {
  it("deletes a checklist and all its items in the same operation (RN-15, critério 23)", async () => {
    const { service, boardRepository, listRepository, cardRepository, checklistRepository } =
      buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });
    await service.createItem(OWNER, boardId, listId, cardId, checklist.id, { text: "Item 1" });
    await service.createItem(OWNER, boardId, listId, cardId, checklist.id, { text: "Item 2" });

    await service.deleteChecklist(OWNER, boardId, listId, cardId, checklist.id);

    expect(checklistRepository.checklists).toHaveLength(0);
    expect(checklistRepository.items).toHaveLength(0);
  });

  it("rejects deleting a checklist that does not exist in the given card (critério 24)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);

    await expect(
      service.deleteChecklist(OWNER, boardId, listId, cardId, crypto.randomUUID()),
    ).rejects.toBeInstanceOf(ChecklistNotFoundError);
  });

  it("rejects deleting a checklist that belongs to a different card (RN-11, critério 24)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId: cardA } = ownedCard(boardRepository, listRepository, cardRepository);
    const cardB = crypto.randomUUID();
    cardRepository.registerCard(cardB, listId);
    const checklistOfA = await service.createChecklist(OWNER, boardId, listId, cardA, {
      name: "Lista de A",
    });

    await expect(
      service.deleteChecklist(OWNER, boardId, listId, cardB, checklistOfA.id),
    ).rejects.toBeInstanceOf(ChecklistNotFoundError);
  });

  it("rejects a second delete attempt of the same checklist (idempotência de erro)", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });

    await service.deleteChecklist(OWNER, boardId, listId, cardId, checklist.id);

    await expect(
      service.deleteChecklist(OWNER, boardId, listId, cardId, checklist.id),
    ).rejects.toBeInstanceOf(ChecklistNotFoundError);
  });
});

describe("ChecklistRepository.getProgressByCards (RN-13, critérios 16, 17, 18, 19, 20)", () => {
  it("omits a card with no checklists from the result (critério 17)", async () => {
    const { boardRepository, listRepository, cardRepository, checklistRepository } =
      buildService();
    const { cardId } = ownedCard(boardRepository, listRepository, cardRepository);

    const progress = await checklistRepository.getProgressByCards([cardId]);

    expect(progress[cardId]).toBeUndefined();
  });

  it("omits a card whose checklists are all empty (critério 17)", async () => {
    const { service, boardRepository, listRepository, cardRepository, checklistRepository } =
      buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    await service.createChecklist(OWNER, boardId, listId, cardId, { name: "Vazia" });

    const progress = await checklistRepository.getProgressByCards([cardId]);

    expect(progress[cardId]).toBeUndefined();
  });

  it("sums items across all checklists of the card (critério 16, 18)", async () => {
    const { service, boardRepository, listRepository, cardRepository, checklistRepository } =
      buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklistA = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "A",
    });
    const checklistB = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "B",
    });
    const item1 = await service.createItem(OWNER, boardId, listId, cardId, checklistA.id, {
      text: "1",
    });
    await service.createItem(OWNER, boardId, listId, cardId, checklistA.id, { text: "2" });
    await service.createItem(OWNER, boardId, listId, cardId, checklistB.id, { text: "3" });
    await service.updateItem(OWNER, boardId, listId, cardId, checklistA.id, item1.id, {
      completed: true,
    });

    const progress = await checklistRepository.getProgressByCards([cardId]);

    expect(progress[cardId]).toEqual({ completed: 1, total: 3 });
  });

  it("reports 100% when every item across every checklist is completed (critério 19)", async () => {
    const { service, boardRepository, listRepository, cardRepository, checklistRepository } =
      buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });
    const item = await service.createItem(OWNER, boardId, listId, cardId, checklist.id, {
      text: "Item",
    });
    await service.updateItem(OWNER, boardId, listId, cardId, checklist.id, item.id, {
      completed: true,
    });

    const progress = await checklistRepository.getProgressByCards([cardId]);

    expect(progress[cardId]).toEqual({ completed: 1, total: 1 });
  });

  it("reports 0 completed (not omitted) when there is at least one item, none completed (critério 20)", async () => {
    const { service, boardRepository, listRepository, cardRepository, checklistRepository } =
      buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });
    await service.createItem(OWNER, boardId, listId, cardId, checklist.id, { text: "Item" });

    const progress = await checklistRepository.getProgressByCards([cardId]);

    expect(progress[cardId]).toEqual({ completed: 0, total: 1 });
  });

  it("recalculates after deleting the only checklist of a card (RN-13, RN-15)", async () => {
    const { service, boardRepository, listRepository, cardRepository, checklistRepository } =
      buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });
    await service.createItem(OWNER, boardId, listId, cardId, checklist.id, { text: "Item" });

    await service.deleteChecklist(OWNER, boardId, listId, cardId, checklist.id);

    const progress = await checklistRepository.getProgressByCards([cardId]);
    expect(progress[cardId]).toBeUndefined();
  });
});

describe("ChecklistsService — RN-07/RN-08 (names/texts need not be unique)", () => {
  it("allows two checklists in the same card to share a name", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);

    await service.createChecklist(OWNER, boardId, listId, cardId, { name: "Sprint" });
    const second = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Sprint",
    });

    expect(second.name).toBe("Sprint");
  });

  it("allows two items in the same checklist to share a text", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const checklist = await service.createChecklist(OWNER, boardId, listId, cardId, {
      name: "Lista",
    });

    await service.createItem(OWNER, boardId, listId, cardId, checklist.id, { text: "Revisar" });
    const second = await service.createItem(OWNER, boardId, listId, cardId, checklist.id, {
      text: "Revisar",
    });

    expect(second.text).toBe("Revisar");
  });
});

describe("ChecklistsService — RF07 RN-13 (acesso generalizado a qualquer membro, critério 28)", () => {
  it("allows a member who did not create the board to create a checklist", async () => {
    const { service, boardRepository, listRepository, cardRepository } = buildService();
    const { boardId, listId, cardId } = ownedCard(boardRepository, listRepository, cardRepository);
    const NON_CREATOR_MEMBER = "member-2";
    boardRepository.addMember(boardId, NON_CREATOR_MEMBER);

    const checklist = await service.createChecklist(NON_CREATOR_MEMBER, boardId, listId, cardId, {
      name: "Feita por membro",
    });

    expect(checklist.cardId).toBe(cardId);
  });
});
