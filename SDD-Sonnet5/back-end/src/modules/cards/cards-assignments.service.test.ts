import crypto from "node:crypto";
import { CardsAssignmentsService } from "./cards-assignments.service";
import { AssignmentNotFoundError } from "./cards-assignments.errors";
import { CardNotFoundError } from "./cards.errors";
import { ListNotFoundError } from "../lists/lists.errors";
import { BoardNotFoundError } from "../boards/boards.errors";
import { ForbiddenRoleError, MemberNotFoundError } from "../boards/boards-members.errors";
import { Card } from "./entities/card.entity";
import { CardRepository } from "./repositories/repository.types";
import {
  AssigneeInfo,
  CardAssignmentRepository,
  CreateCardAssignmentData,
} from "./repositories/card-assignment.repository.types";
import { List } from "../lists/entities/list.entity";
import { ListRepository } from "../lists/repositories/repository.types";
import { Board } from "../boards/entities/board.entity";
import { BoardRepository } from "../boards/repositories/repository.types";
import { BoardMember, BoardMemberRole } from "../boards/entities/board-member.entity";
import {
  BoardMemberRepository,
  CreateBoardMemberData,
  MemberInfo,
} from "../boards/repositories/board-member.repository.types";

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
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async findAllByList(): Promise<Card[]> {
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async update(): Promise<Card | null> {
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async move(): Promise<Card | null> {
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async deleteAllByList(): Promise<number> {
    throw new Error("not used by CardsAssignmentsService tests");
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
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async findAllByBoard(): Promise<List[]> {
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async countByBoard(): Promise<number> {
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async update(): Promise<List | null> {
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async delete(): Promise<boolean> {
    throw new Error("not used by CardsAssignmentsService tests");
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
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async findAllByMember(): Promise<Board[]> {
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async updateByIdAndMember(): Promise<Board | null> {
    throw new Error("not used by CardsAssignmentsService tests");
  }

  async deleteById(): Promise<boolean> {
    throw new Error("not used by CardsAssignmentsService tests");
  }
}

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
      .map((m) => ({ userId: m.userId, name: m.userId, email: `${m.userId}@example.com`, role: m.role }));
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

class FakeCardAssignmentRepository implements CardAssignmentRepository {
  readonly assignments: { cardId: string; userId: string; boardId: string }[] = [];

  async create(data: CreateCardAssignmentData): Promise<never> {
    if (!this.assignments.some((a) => a.cardId === data.cardId && a.userId === data.userId)) {
      this.assignments.push(data);
    }
    return undefined as never;
  }

  async exists(cardId: string, userId: string): Promise<boolean> {
    return this.assignments.some((a) => a.cardId === cardId && a.userId === userId);
  }

  async delete(cardId: string, userId: string): Promise<boolean> {
    const index = this.assignments.findIndex((a) => a.cardId === cardId && a.userId === userId);
    if (index === -1) return false;
    this.assignments.splice(index, 1);
    return true;
  }

  async findAllByCardIds(cardIds: string[]): Promise<Record<string, AssigneeInfo[]>> {
    const result: Record<string, AssigneeInfo[]> = {};
    for (const a of this.assignments) {
      if (!cardIds.includes(a.cardId)) continue;
      const list = result[a.cardId] ?? (result[a.cardId] = []);
      list.push({ userId: a.userId, name: a.userId, email: `${a.userId}@example.com` });
    }
    return result;
  }

  async deleteAllByBoardAndUser(boardId: string, userId: string): Promise<number> {
    const before = this.assignments.length;
    for (let i = this.assignments.length - 1; i >= 0; i -= 1) {
      const a = this.assignments[i];
      if (a && a.boardId === boardId && a.userId === userId) {
        this.assignments.splice(i, 1);
      }
    }
    return before - this.assignments.length;
  }
}

const ADMIN = "admin-1";
const MEMBER = "member-1";
const OUTSIDER = "outsider-1";

function buildService() {
  const cardRepository = new FakeCardRepository();
  const listRepository = new FakeListRepository();
  const boardRepository = new FakeBoardRepository();
  const boardMemberRepository = new FakeBoardMemberRepository();
  const cardAssignmentRepository = new FakeCardAssignmentRepository();
  const service = new CardsAssignmentsService(
    cardAssignmentRepository,
    cardRepository,
    listRepository,
    boardRepository,
    boardMemberRepository,
  );
  return {
    service,
    cardRepository,
    listRepository,
    boardRepository,
    boardMemberRepository,
    cardAssignmentRepository,
  };
}

async function buildBoardListCard(deps: ReturnType<typeof buildService>) {
  const boardId = crypto.randomUUID();
  deps.boardRepository.registerBoard(boardId, ADMIN, MEMBER);
  await deps.boardMemberRepository.create({ boardId, userId: ADMIN, role: "administrador" });
  await deps.boardMemberRepository.create({ boardId, userId: MEMBER, role: "membro" });
  const listId = crypto.randomUUID();
  deps.listRepository.registerList(listId, boardId);
  const cardId = crypto.randomUUID();
  deps.cardRepository.registerCard(cardId, listId);
  return { boardId, listId, cardId };
}

describe("CardsAssignmentsService.assign (RN-09, RN-10, RN-11, critérios 21, 22, 24, 25)", () => {
  it("assigns a board member to a card and returns the assigned member's data (critério 21, Plano §4)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    const result = await deps.service.assign(ADMIN, boardId, listId, cardId, MEMBER);

    expect(result).toEqual({ userId: MEMBER, name: MEMBER, email: `${MEMBER}@example.com` });
    expect(await deps.cardAssignmentRepository.exists(cardId, MEMBER)).toBe(true);
  });

  it("allows more than one member assigned to the same card (critério 22)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    await deps.service.assign(ADMIN, boardId, listId, cardId, MEMBER);
    await deps.service.assign(ADMIN, boardId, listId, cardId, ADMIN);

    const assignees = await deps.cardAssignmentRepository.findAllByCardIds([cardId]);
    expect(assignees[cardId]?.map((a) => a.userId).sort()).toEqual([ADMIN, MEMBER].sort());
  });

  it("assigning the same member twice is idempotent, not an error (Plano §4)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    await deps.service.assign(ADMIN, boardId, listId, cardId, MEMBER);
    await expect(
      deps.service.assign(ADMIN, boardId, listId, cardId, MEMBER),
    ).resolves.toEqual({ userId: MEMBER, name: MEMBER, email: `${MEMBER}@example.com` });

    const assignees = await deps.cardAssignmentRepository.findAllByCardIds([cardId]);
    expect(assignees[cardId]?.map((a) => a.userId)).toEqual([MEMBER]);
  });

  it("rejects assigning a user who is not a member of the board (critério 24)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    await expect(
      deps.service.assign(ADMIN, boardId, listId, cardId, OUTSIDER),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it("rejects when the caller is a member but not an administrator (critério 25)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    await expect(
      deps.service.assign(MEMBER, boardId, listId, cardId, MEMBER),
    ).rejects.toBeInstanceOf(ForbiddenRoleError);
  });

  it("rejects when the caller is not a member of the board", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    await expect(
      deps.service.assign(OUTSIDER, boardId, listId, cardId, MEMBER),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("rejects for a list that does not belong to the given board", async () => {
    const deps = buildService();
    const { boardId, cardId } = await buildBoardListCard(deps);

    await expect(
      deps.service.assign(ADMIN, boardId, crypto.randomUUID(), cardId, MEMBER),
    ).rejects.toBeInstanceOf(ListNotFoundError);
  });

  it("rejects for a card that does not belong to the given list", async () => {
    const deps = buildService();
    const { boardId, listId } = await buildBoardListCard(deps);

    await expect(
      deps.service.assign(ADMIN, boardId, listId, crypto.randomUUID(), MEMBER),
    ).rejects.toBeInstanceOf(CardNotFoundError);
  });
});

describe("CardsAssignmentsService.unassign (RN-09, critério 23)", () => {
  it("removes an assigned member from a card (critério 23)", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);
    await deps.service.assign(ADMIN, boardId, listId, cardId, MEMBER);

    await deps.service.unassign(ADMIN, boardId, listId, cardId, MEMBER);

    expect(await deps.cardAssignmentRepository.exists(cardId, MEMBER)).toBe(false);
  });

  it("rejects unassigning a user who is not currently assigned to the card", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);

    await expect(
      deps.service.unassign(ADMIN, boardId, listId, cardId, MEMBER),
    ).rejects.toBeInstanceOf(AssignmentNotFoundError);
  });

  it("rejects when the caller is a member but not an administrator", async () => {
    const deps = buildService();
    const { boardId, listId, cardId } = await buildBoardListCard(deps);
    await deps.service.assign(ADMIN, boardId, listId, cardId, MEMBER);

    await expect(
      deps.service.unassign(MEMBER, boardId, listId, cardId, MEMBER),
    ).rejects.toBeInstanceOf(ForbiddenRoleError);
  });
});
