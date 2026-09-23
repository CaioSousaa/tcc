import crypto from "node:crypto";
import { CardsLabelsService } from "./cards-labels.service";
import { CardLabelNotFoundError } from "./cards-labels.errors";
import { CardNotFoundError } from "./cards.errors";
import { ListNotFoundError } from "../lists/lists.errors";
import { BoardNotFoundError } from "../boards/boards.errors";
import { LabelNotFoundError } from "../labels/labels.errors";
import { Card } from "./entities/card.entity";
import { CardRepository } from "./repositories/repository.types";
import {
  CardLabelRepository,
  CreateCardLabelData,
  LabelInfo,
} from "./repositories/card-label.repository.types";
import { List } from "../lists/entities/list.entity";
import { ListRepository } from "../lists/repositories/repository.types";
import { Board } from "../boards/entities/board.entity";
import { BoardRepository } from "../boards/repositories/repository.types";
import { Label, LabelColor } from "../labels/entities/label.entity";
import {
  CreateLabelData,
  LabelRepository,
  UpdateLabelData,
} from "../labels/repositories/repository.types";

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
    throw new Error("not used by CardsLabelsService tests");
  }

  async findAllByList(): Promise<Card[]> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async update(): Promise<Card | null> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async move(): Promise<Card | null> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async deleteAllByList(): Promise<number> {
    throw new Error("not used by CardsLabelsService tests");
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
    throw new Error("not used by CardsLabelsService tests");
  }

  async findAllByBoard(): Promise<List[]> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async countByBoard(): Promise<number> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async update(): Promise<List | null> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by CardsLabelsService tests");
  }
}

class FakeBoardRepository implements BoardRepository {
  private readonly boards = new Map<string, { id: string; memberIds: Set<string> }>();

  registerBoard(id: string, ...members: string[]) {
    this.boards.set(id, { id, memberIds: new Set(members) });
  }

  async findByIdAndMember(id: string, userId: string): Promise<Board | null> {
    const board = this.boards.get(id);
    if (!board || !board.memberIds.has(userId)) return null;
    return board as unknown as Board;
  }

  async create(): Promise<Board> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async findAllByMember(): Promise<Board[]> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async updateByIdAndMember(): Promise<Board | null> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async deleteById(): Promise<boolean> {
    throw new Error("not used by CardsLabelsService tests");
  }
}

class FakeLabelRepository implements LabelRepository {
  readonly labels: Label[] = [];

  registerLabel(id: string, boardId: string, name = "X", color: LabelColor = "verde"): Label {
    const label: Label = {
      id,
      boardId,
      name,
      color,
      board: undefined as unknown as Label["board"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.labels.push(label);
    return label;
  }

  async create(data: CreateLabelData): Promise<Label> {
    return this.registerLabel(crypto.randomUUID(), data.boardId, data.name, data.color);
  }

  async findAllByBoard(boardId: string): Promise<Label[]> {
    return this.labels.filter((l) => l.boardId === boardId);
  }

  async findByIdAndBoard(id: string, boardId: string): Promise<Label | null> {
    return this.labels.find((l) => l.id === id && l.boardId === boardId) ?? null;
  }

  async update(): Promise<Label | null> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by CardsLabelsService tests");
  }
}

class FakeCardLabelRepository implements CardLabelRepository {
  readonly associations: { cardId: string; labelId: string }[] = [];

  async create(data: CreateCardLabelData): Promise<never> {
    if (!this.associations.some((a) => a.cardId === data.cardId && a.labelId === data.labelId)) {
      this.associations.push(data);
    }
    return undefined as never;
  }

  async delete(cardId: string, labelId: string): Promise<boolean> {
    const index = this.associations.findIndex((a) => a.cardId === cardId && a.labelId === labelId);
    if (index === -1) return false;
    this.associations.splice(index, 1);
    return true;
  }

  async findAllByCardIds(): Promise<Record<string, LabelInfo[]>> {
    throw new Error("not used by CardsLabelsService tests");
  }

  async filterCardIdsByLabels(): Promise<Set<string>> {
    throw new Error("not used by CardsLabelsService tests");
  }
}

const OWNER = "owner-1";
const OUTSIDER = "outsider-1";

function buildService() {
  const cardRepository = new FakeCardRepository();
  const listRepository = new FakeListRepository();
  const boardRepository = new FakeBoardRepository();
  const labelRepository = new FakeLabelRepository();
  const cardLabelRepository = new FakeCardLabelRepository();
  const service = new CardsLabelsService(
    cardLabelRepository,
    cardRepository,
    listRepository,
    boardRepository,
    labelRepository,
  );
  return {
    service,
    cardRepository,
    listRepository,
    boardRepository,
    labelRepository,
    cardLabelRepository,
  };
}

async function buildBoardListCardLabel(deps: ReturnType<typeof buildService>) {
  const boardId = crypto.randomUUID();
  deps.boardRepository.registerBoard(boardId, OWNER);
  const listId = crypto.randomUUID();
  deps.listRepository.registerList(listId, boardId);
  const cardId = crypto.randomUUID();
  deps.cardRepository.registerCard(cardId, listId);
  const labelId = crypto.randomUUID();
  deps.labelRepository.registerLabel(labelId, boardId, "Urgente", "vermelho");
  return { boardId, listId, cardId, labelId };
}

describe("CardsLabelsService.associate (RN-06, RN-07, RN-08, critérios 17, 18, 19, 20, 21)", () => {
  it("associates a label of the same board to a card (critério 17)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId, labelId } = await buildBoardListCardLabel(deps);

    const result = await deps.service.associate(OWNER, boardId, listId, cardId, labelId);

    expect(result.id).toBe(labelId);
    expect(deps.cardLabelRepository.associations).toEqual([{ cardId, labelId }]);
  });

  it("allows a second label to coexist on the same card (critério 18)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId, labelId } = await buildBoardListCardLabel(deps);
    const secondLabelId = crypto.randomUUID();
    deps.labelRepository.registerLabel(secondLabelId, boardId, "Bug", "azul");

    await deps.service.associate(OWNER, boardId, listId, cardId, labelId);
    await deps.service.associate(OWNER, boardId, listId, cardId, secondLabelId);

    expect(deps.cardLabelRepository.associations).toHaveLength(2);
  });

  it("associating the same label twice is idempotent, not an error (critério 19)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId, labelId } = await buildBoardListCardLabel(deps);

    await deps.service.associate(OWNER, boardId, listId, cardId, labelId);
    await expect(
      deps.service.associate(OWNER, boardId, listId, cardId, labelId),
    ).resolves.toMatchObject({ id: labelId });

    expect(deps.cardLabelRepository.associations).toHaveLength(1);
  });

  it("rejects associating a label that belongs to another board (critério 20)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCardLabel(deps);
    const otherBoardId = crypto.randomUUID();
    const foreignLabelId = crypto.randomUUID();
    deps.labelRepository.registerLabel(foreignLabelId, otherBoardId);

    await expect(
      deps.service.associate(OWNER, boardId, listId, cardId, foreignLabelId),
    ).rejects.toBeInstanceOf(LabelNotFoundError);
  });

  it("rejects when the card does not exist in the given list (critério 21)", async () => {
    const deps = buildService();
    const { boardId, listId, labelId } = await buildBoardListCardLabel(deps);

    await expect(
      deps.service.associate(OWNER, boardId, listId, crypto.randomUUID(), labelId),
    ).rejects.toBeInstanceOf(CardNotFoundError);
  });

  it("rejects when the list does not exist in the given board", async () => {
    const deps = buildService();
    const { boardId, cardId, labelId } = await buildBoardListCardLabel(deps);

    await expect(
      deps.service.associate(OWNER, boardId, crypto.randomUUID(), cardId, labelId),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });

  it("rejects when the caller is not a member of the board", async () => {
    const deps = buildService();
    const { boardId, listId, cardId, labelId } = await buildBoardListCardLabel(deps);

    await expect(
      deps.service.associate(OUTSIDER, boardId, listId, cardId, labelId),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("CardsLabelsService.dissociate (RN-09, critérios 22, 23)", () => {
  it("removes an associated label from a card (critério 22)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId, labelId } = await buildBoardListCardLabel(deps);
    await deps.service.associate(OWNER, boardId, listId, cardId, labelId);

    await deps.service.dissociate(OWNER, boardId, listId, cardId, labelId);

    expect(deps.cardLabelRepository.associations).toEqual([]);
  });

  it("rejects dissociating a label that is not currently associated with the card (critério 23)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId, labelId } = await buildBoardListCardLabel(deps);

    await expect(
      deps.service.dissociate(OWNER, boardId, listId, cardId, labelId),
    ).rejects.toBeInstanceOf(CardLabelNotFoundError);
  });
});
