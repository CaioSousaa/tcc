import crypto from "node:crypto";
import { LabelsService } from "./labels.service";
import { LabelNotFoundError } from "./labels.errors";
import { BoardNotFoundError } from "../boards/boards.errors";
import { Label, LabelColor } from "./entities/label.entity";
import { CreateLabelData, LabelRepository, UpdateLabelData } from "./repositories/repository.types";
import { Board } from "../boards/entities/board.entity";
import { BoardRepository } from "../boards/repositories/repository.types";

class FakeLabelRepository implements LabelRepository {
  readonly labels: Label[] = [];

  async create(data: CreateLabelData): Promise<Label> {
    const label: Label = {
      id: crypto.randomUUID(),
      boardId: data.boardId,
      name: data.name,
      color: data.color,
      board: undefined as unknown as Label["board"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.labels.push(label);
    return label;
  }

  async findAllByBoard(boardId: string): Promise<Label[]> {
    return this.labels.filter((l) => l.boardId === boardId);
  }

  async findByIdAndBoard(id: string, boardId: string): Promise<Label | null> {
    return this.labels.find((l) => l.id === id && l.boardId === boardId) ?? null;
  }

  async update(id: string, boardId: string, data: UpdateLabelData): Promise<Label | null> {
    const label = this.labels.find((l) => l.id === id && l.boardId === boardId);
    if (!label) return null;
    if (data.name !== undefined) label.name = data.name;
    if (data.color !== undefined) label.color = data.color;
    label.updatedAt = new Date();
    return label;
  }

  async delete(id: string, boardId: string): Promise<boolean> {
    const index = this.labels.findIndex((l) => l.id === id && l.boardId === boardId);
    if (index === -1) return false;
    this.labels.splice(index, 1);
    return true;
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
    throw new Error("not used by LabelsService tests");
  }

  async findAllByMember(): Promise<Board[]> {
    throw new Error("not used by LabelsService tests");
  }

  async updateByIdAndMember(): Promise<Board | null> {
    throw new Error("not used by LabelsService tests");
  }

  async deleteById(): Promise<boolean> {
    throw new Error("not used by LabelsService tests");
  }
}

const OWNER = "owner-1";
const OTHER_OWNER = "owner-2";
const GREEN: LabelColor = "verde";

function buildService() {
  const labelRepository = new FakeLabelRepository();
  const boardRepository = new FakeBoardRepository();
  const service = new LabelsService(labelRepository, boardRepository);
  return { service, labelRepository, boardRepository };
}

function ownedBoard(boardRepository: FakeBoardRepository, owner = OWNER): string {
  const boardId = crypto.randomUUID();
  boardRepository.registerBoard(boardId, owner);
  return boardId;
}

describe("LabelsService.create (RN-01, RN-04, critérios 1, 5)", () => {
  it("creates a label belonging to the board (critério 1)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);

    const label = await service.create(OWNER, boardId, { name: "Urgente", color: GREEN });

    expect(label.boardId).toBe(boardId);
    expect(label.name).toBe("Urgente");
    expect(label.color).toBe(GREEN);
  });

  it("allows two labels with the same name and color in the same board (RN-04, critério 5)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);

    await service.create(OWNER, boardId, { name: "Bug", color: "vermelho" });
    const second = await service.create(OWNER, boardId, { name: "Bug", color: "vermelho" });

    expect(second.name).toBe("Bug");
    expect(second.color).toBe("vermelho");
  });

  it("rejects creating a label on a board the caller is not a member of (critério 7)", async () => {
    const { service, boardRepository } = buildService();
    const foreignBoardId = ownedBoard(boardRepository, OTHER_OWNER);

    await expect(
      service.create(OWNER, foreignBoardId, { name: "X", color: GREEN }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("LabelsService.list (critérios 8, 9, 10)", () => {
  it("returns every label of the board (critério 8)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    await service.create(OWNER, boardId, { name: "A", color: GREEN });
    await service.create(OWNER, boardId, { name: "B", color: "azul" });

    const labels = await service.list(OWNER, boardId);

    expect(labels.map((l) => l.name).sort()).toEqual(["A", "B"]);
  });

  it("returns an empty list for a board with no labels (critério 9)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);

    await expect(service.list(OWNER, boardId)).resolves.toEqual([]);
  });

  it("rejects listing labels of a board the caller is not a member of (critério 10)", async () => {
    const { service, boardRepository } = buildService();
    const foreignBoardId = ownedBoard(boardRepository, OTHER_OWNER);

    await expect(service.list(OWNER, foreignBoardId)).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("LabelsService.update (critérios 11, 12, 13, 14)", () => {
  it("updates the name (critério 11)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const label = await service.create(OWNER, boardId, { name: "Antigo", color: GREEN });

    const updated = await service.update(OWNER, boardId, label.id, { name: "Novo" });

    expect(updated.name).toBe("Novo");
    expect(updated.color).toBe(GREEN);
  });

  it("updates the color (critério 12)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const label = await service.create(OWNER, boardId, { name: "X", color: GREEN });

    const updated = await service.update(OWNER, boardId, label.id, { color: "roxo" });

    expect(updated.color).toBe("roxo");
    expect(updated.name).toBe("X");
  });

  it("rejects updating a label that does not exist or belongs to another board (critério 13)", async () => {
    const { service, boardRepository } = buildService();
    const boardA = ownedBoard(boardRepository);
    const boardB = ownedBoard(boardRepository);
    const labelOfA = await service.create(OWNER, boardA, { name: "X", color: GREEN });

    await expect(
      service.update(OWNER, boardA, crypto.randomUUID(), { name: "Y" }),
    ).rejects.toBeInstanceOf(LabelNotFoundError);
    await expect(
      service.update(OWNER, boardB, labelOfA.id, { name: "Y" }),
    ).rejects.toBeInstanceOf(LabelNotFoundError);
  });

  it("rejects updating a label on a board the caller is not a member of (critério 14)", async () => {
    const { service, boardRepository } = buildService();
    const foreignBoardId = ownedBoard(boardRepository, OTHER_OWNER);

    await expect(
      service.update(OWNER, foreignBoardId, crypto.randomUUID(), { name: "Y" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("LabelsService.remove (critérios 15, 16)", () => {
  it("deletes a label (critério 15)", async () => {
    const { service, boardRepository, labelRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const label = await service.create(OWNER, boardId, { name: "X", color: GREEN });

    await service.remove(OWNER, boardId, label.id);

    expect(labelRepository.labels).toHaveLength(0);
  });

  it("rejects deleting a label that does not exist, was already deleted, or belongs to another board (critério 16)", async () => {
    const { service, boardRepository } = buildService();
    const boardId = ownedBoard(boardRepository);
    const label = await service.create(OWNER, boardId, { name: "X", color: GREEN });

    await service.remove(OWNER, boardId, label.id);

    await expect(service.remove(OWNER, boardId, label.id)).rejects.toBeInstanceOf(
      LabelNotFoundError,
    );
    await expect(
      service.remove(OWNER, boardId, crypto.randomUUID()),
    ).rejects.toBeInstanceOf(LabelNotFoundError);
  });
});
