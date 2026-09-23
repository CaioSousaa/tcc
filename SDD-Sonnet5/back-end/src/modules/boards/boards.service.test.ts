import crypto from "node:crypto";
import { BoardsService } from "./boards.service";
import { BoardNotFoundError } from "./boards.errors";
import { ForbiddenRoleError } from "./boards-members.errors";
import { Board } from "./entities/board.entity";
import { BoardMember, BoardMemberRole } from "./entities/board-member.entity";
import {
  BoardRepository,
  CreateBoardData,
  UpdateBoardData,
} from "./repositories/repository.types";
import {
  BoardMemberRepository,
  CreateBoardMemberData,
  MemberInfo,
} from "./repositories/board-member.repository.types";

class FakeBoardMemberRepository implements BoardMemberRepository {
  readonly members: BoardMember[] = [];

  async create(data: CreateBoardMemberData): Promise<BoardMember> {
    const member: BoardMember = {
      id: crypto.randomUUID(),
      boardId: data.boardId,
      userId: data.userId,
      role: data.role,
      board: undefined as unknown as BoardMember["board"],
      user: undefined as unknown as BoardMember["user"],
      createdAt: new Date(),
    };
    this.members.push(member);
    return member;
  }

  async findAllByBoard(boardId: string): Promise<BoardMember[]> {
    return this.members.filter((m) => m.boardId === boardId);
  }

  async findAllByBoardWithUser(boardId: string): Promise<MemberInfo[]> {
    return this.members
      .filter((m) => m.boardId === boardId)
      .map((m) => ({ userId: m.userId, name: m.userId, email: m.userId, role: m.role }));
  }

  async findByBoardAndUser(boardId: string, userId: string): Promise<BoardMember | null> {
    return this.members.find((m) => m.boardId === boardId && m.userId === userId) ?? null;
  }

  async findAllByUserId(userId: string): Promise<BoardMember[]> {
    return this.members.filter((m) => m.userId === userId);
  }

  async updateRole(
    boardId: string,
    userId: string,
    role: BoardMemberRole,
  ): Promise<BoardMember | null> {
    const member = this.members.find((m) => m.boardId === boardId && m.userId === userId);
    if (!member) return null;
    member.role = role;
    return member;
  }

  async delete(boardId: string, userId: string): Promise<boolean> {
    const index = this.members.findIndex((m) => m.boardId === boardId && m.userId === userId);
    if (index === -1) return false;
    this.members.splice(index, 1);
    return true;
  }

  async countAdminsByBoard(boardId: string): Promise<number> {
    return this.members.filter((m) => m.boardId === boardId && m.role === "administrador").length;
  }
}

class FakeBoardRepository implements BoardRepository {
  readonly boards: Board[] = [];

  constructor(private readonly memberRepository: FakeBoardMemberRepository) {}

  async create(data: CreateBoardData): Promise<Board> {
    const board: Board = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description ?? null,
      ownerId: data.ownerId,
      owner: undefined as unknown as Board["owner"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.boards.push(board);
    return board;
  }

  async findAllByMember(userId: string): Promise<Board[]> {
    const boardIds = this.memberRepository.members
      .filter((m) => m.userId === userId)
      .map((m) => m.boardId);
    return this.boards.filter((b) => boardIds.includes(b.id));
  }

  async findByIdAndMember(id: string, userId: string): Promise<Board | null> {
    const isMember = this.memberRepository.members.some(
      (m) => m.boardId === id && m.userId === userId,
    );
    if (!isMember) return null;
    return this.boards.find((b) => b.id === id) ?? null;
  }

  async updateByIdAndMember(
    id: string,
    userId: string,
    data: UpdateBoardData,
  ): Promise<Board | null> {
    const board = await this.findByIdAndMember(id, userId);
    if (!board) return null;
    if (data.name !== undefined) board.name = data.name;
    if (data.description !== undefined) board.description = data.description;
    board.updatedAt = new Date();
    return board;
  }

  async deleteById(id: string): Promise<boolean> {
    const index = this.boards.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.boards.splice(index, 1);
    return true;
  }
}

function buildService() {
  const boardMemberRepository = new FakeBoardMemberRepository();
  const boardRepository = new FakeBoardRepository(boardMemberRepository);
  const service = new BoardsService(boardRepository, boardMemberRepository);
  return { service, boardRepository, boardMemberRepository };
}

const OWNER = "owner-1";
const OTHER_OWNER = "owner-2";

describe("BoardsService.create (RN-01, RN-04, critérios 1, 4)", () => {
  it("creates a board owned by the caller (critério 1)", async () => {
    const { service } = buildService();
    const { board } = await service.create(OWNER, { name: "Projeto TCC" });

    expect(board.ownerId).toBe(OWNER);
    expect(board.name).toBe("Projeto TCC");
  });

  it("creates a board without description when none is provided (critério 4)", async () => {
    const { service } = buildService();
    const { board } = await service.create(OWNER, { name: "Projeto TCC" });

    expect(board.description).toBeNull();
  });

  it("allows two boards with the same name for the same owner (RN-04)", async () => {
    const { service } = buildService();
    await service.create(OWNER, { name: "Sprint" });
    const { board: second } = await service.create(OWNER, { name: "Sprint" });

    expect(second.name).toBe("Sprint");
  });

  it("makes the creator an administrator member automatically (RF07, RN-02, critério 27)", async () => {
    const { service, boardMemberRepository } = buildService();
    const { board, role } = await service.create(OWNER, { name: "Projeto TCC" });

    expect(role).toBe("administrador");
    const membership = await boardMemberRepository.findByBoardAndUser(board.id, OWNER);
    expect(membership?.role).toBe("administrador");
  });
});

describe("BoardsService.list (RN-08, critérios 6, 7 / RF07 RN-14, critério 30)", () => {
  it("returns only boards the caller is a member of (critério 6)", async () => {
    const { service } = buildService();
    await service.create(OWNER, { name: "Meu quadro" });
    await service.create(OTHER_OWNER, { name: "Quadro de outro usuário" });

    const results = await service.list(OWNER);

    expect(results).toHaveLength(1);
    expect(results[0]?.board.ownerId).toBe(OWNER);
    expect(results[0]?.role).toBe("administrador");
  });

  it("returns an empty list when the caller has no boards (critério 7)", async () => {
    const { service } = buildService();
    const results = await service.list(OWNER);
    expect(results).toEqual([]);
  });

  it("includes boards the caller was added to as a member, not only the ones they created (RF07, RN-14, critério 30)", async () => {
    const { service, boardMemberRepository } = buildService();
    const { board } = await service.create(OTHER_OWNER, { name: "Quadro compartilhado" });
    await boardMemberRepository.create({ boardId: board.id, userId: OWNER, role: "membro" });

    const results = await service.list(OWNER);

    expect(results).toHaveLength(1);
    expect(results[0]?.board.id).toBe(board.id);
    expect(results[0]?.role).toBe("membro");
  });
});

describe("BoardsService.getById (RN-06, critérios 8, 9, 10)", () => {
  it("returns the full board and the caller's role when the caller is a member (critério 8)", async () => {
    const { service } = buildService();
    const { board: created } = await service.create(OWNER, {
      name: "Meu quadro",
      description: "desc",
    });

    const { board, role } = await service.getById(OWNER, created.id);

    expect(board).toEqual(created);
    expect(role).toBe("administrador");
  });

  it("throws BoardNotFoundError for a board id that does not exist (critério 9)", async () => {
    const { service } = buildService();
    await expect(service.getById(OWNER, crypto.randomUUID())).rejects.toBeInstanceOf(
      BoardNotFoundError,
    );
  });

  it("throws the same BoardNotFoundError for a board the caller is not a member of (RN-06, critério 10)", async () => {
    const { service } = buildService();
    const { board: created } = await service.create(OTHER_OWNER, { name: "Não é meu" });

    let notFoundForMissing: unknown;
    let notFoundForOthersBoard: unknown;
    try {
      await service.getById(OWNER, crypto.randomUUID());
    } catch (err) {
      notFoundForMissing = err;
    }
    try {
      await service.getById(OWNER, created.id);
    } catch (err) {
      notFoundForOthersBoard = err;
    }

    expect(notFoundForMissing).toBeInstanceOf(BoardNotFoundError);
    expect(notFoundForOthersBoard).toBeInstanceOf(BoardNotFoundError);
    expect((notFoundForMissing as BoardNotFoundError).message).toBe(
      (notFoundForOthersBoard as BoardNotFoundError).message,
    );
  });
});

describe("BoardsService.update (RN-09, critérios 11, 12, 13, 14 / RF07 RN-13)", () => {
  it("updates the name (critério 11)", async () => {
    const { service } = buildService();
    const { board: created } = await service.create(OWNER, { name: "Antigo nome" });

    const { board: updated } = await service.update(OWNER, created.id, { name: "Novo nome" });

    expect(updated.name).toBe("Novo nome");
  });

  it("updates the description (critério 12)", async () => {
    const { service } = buildService();
    const { board: created } = await service.create(OWNER, { name: "Quadro" });

    const { board: updated } = await service.update(OWNER, created.id, {
      description: "Nova descrição",
    });

    expect(updated.description).toBe("Nova descrição");
  });

  it("leaves fields not sent unchanged (RN-09)", async () => {
    const { service } = buildService();
    const { board: created } = await service.create(OWNER, {
      name: "Quadro",
      description: "original",
    });

    const { board: updated } = await service.update(OWNER, created.id, { name: "Renomeado" });

    expect(updated.name).toBe("Renomeado");
    expect(updated.description).toBe("original");
  });

  it("does not error and does not change anything on an empty update payload (RN-09)", async () => {
    const { service } = buildService();
    const { board: created } = await service.create(OWNER, {
      name: "Quadro",
      description: "original",
    });

    const { board: updated } = await service.update(OWNER, created.id, {});

    expect(updated.name).toBe("Quadro");
    expect(updated.description).toBe("original");
  });

  it("throws BoardNotFoundError when trying to update a board the caller is not a member of (RN-06, critério 14)", async () => {
    const { service } = buildService();
    const { board: created } = await service.create(OTHER_OWNER, { name: "Não é meu" });

    await expect(
      service.update(OWNER, created.id, { name: "Tentativa" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("throws BoardNotFoundError when trying to update a board that does not exist", async () => {
    const { service } = buildService();
    await expect(
      service.update(OWNER, crypto.randomUUID(), { name: "Tentativa" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("allows a non-admin member to update the board (RF07, RN-13, critério 28)", async () => {
    const { service, boardMemberRepository } = buildService();
    const { board: created } = await service.create(OTHER_OWNER, { name: "Quadro" });
    await boardMemberRepository.create({ boardId: created.id, userId: OWNER, role: "membro" });

    const { board: updated, role } = await service.update(OWNER, created.id, {
      name: "Renomeado por membro",
    });

    expect(updated.name).toBe("Renomeado por membro");
    expect(role).toBe("membro");
  });
});

describe("BoardsService.remove (RN-06, RN-07, critérios 15, 16, 17 / RF07 RN-12, critério 29)", () => {
  it("deletes a board when the caller is an administrator (critério 15)", async () => {
    const { service, boardRepository } = buildService();
    const { board: created } = await service.create(OWNER, { name: "Quadro" });

    await service.remove(OWNER, created.id);

    expect(boardRepository.boards).toHaveLength(0);
    await expect(service.getById(OWNER, created.id)).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("throws BoardNotFoundError when deleting a board the caller is not a member of (RN-06, critério 16)", async () => {
    const { service } = buildService();
    const { board: created } = await service.create(OTHER_OWNER, { name: "Não é meu" });

    await expect(service.remove(OWNER, created.id)).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("throws BoardNotFoundError on a second delete attempt of the same board (critério 17)", async () => {
    const { service } = buildService();
    const { board: created } = await service.create(OWNER, { name: "Quadro" });

    await service.remove(OWNER, created.id);

    await expect(service.remove(OWNER, created.id)).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("throws ForbiddenRoleError when a non-admin member tries to delete the board (RF07, RN-12, critério 29)", async () => {
    const { service, boardMemberRepository } = buildService();
    const { board: created } = await service.create(OTHER_OWNER, { name: "Quadro" });
    await boardMemberRepository.create({ boardId: created.id, userId: OWNER, role: "membro" });

    await expect(service.remove(OWNER, created.id)).rejects.toBeInstanceOf(ForbiddenRoleError);
  });
});
