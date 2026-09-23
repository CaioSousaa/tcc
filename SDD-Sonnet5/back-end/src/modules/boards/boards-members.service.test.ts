import crypto from "node:crypto";
import { BoardsMembersService } from "./boards-members.service";
import {
  ForbiddenRoleError,
  LastAdministratorError,
  MemberAlreadyExistsError,
  MemberNotFoundError,
  UserNotFoundError,
} from "./boards-members.errors";
import { BoardNotFoundError } from "./boards.errors";
import { BoardMember, BoardMemberRole } from "./entities/board-member.entity";
import {
  BoardMemberRepository,
  CreateBoardMemberData,
  MemberInfo,
} from "./repositories/board-member.repository.types";
import { CreateUserData, UserRepository } from "../auth/repositories/repository.types";
import { User } from "../auth/entities/user.entity";
import { CardAssignmentRepository } from "../cards/repositories/card-assignment.repository.types";

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

class FakeUserRepository implements UserRepository {
  readonly users: User[] = [];

  registerUser(id: string, email: string, name = email): User {
    const user: User = {
      id,
      name,
      email,
      passwordHash: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
      refreshTokens: [],
      boards: [],
    };
    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    return this.registerUser(crypto.randomUUID(), data.email, data.name);
  }
}

class FakeCardAssignmentRepository implements CardAssignmentRepository {
  readonly deletedForBoardAndUser: { boardId: string; userId: string }[] = [];

  create(): never {
    throw new Error("not used by BoardsMembersService tests");
  }

  async exists(): Promise<boolean> {
    return false;
  }

  async delete(): Promise<boolean> {
    return false;
  }

  async findAllByCardIds(): Promise<Record<string, never[]>> {
    return {};
  }

  async deleteAllByBoardAndUser(boardId: string, userId: string): Promise<number> {
    this.deletedForBoardAndUser.push({ boardId, userId });
    return 0;
  }
}

const BOARD = "board-1";
const ADMIN = "admin-1";
const OTHER_ADMIN = "admin-2";
const MEMBER = "member-1";
const OUTSIDER = "outsider-1";

function buildService() {
  const boardMemberRepository = new FakeBoardMemberRepository();
  const userRepository = new FakeUserRepository();
  const cardAssignmentRepository = new FakeCardAssignmentRepository();
  const service = new BoardsMembersService(
    boardMemberRepository,
    userRepository,
    cardAssignmentRepository,
  );
  return { service, boardMemberRepository, userRepository, cardAssignmentRepository };
}

async function withAdmin(boardMemberRepository: FakeBoardMemberRepository, boardId = BOARD) {
  await boardMemberRepository.create({ boardId, userId: ADMIN, role: "administrador" });
}

describe("BoardsMembersService.invite (RN-01 a RN-06, critérios 1-7)", () => {
  it("adds an existing user as administrador (critério 1)", async () => {
    const { service, boardMemberRepository, userRepository } = buildService();
    await withAdmin(boardMemberRepository);
    userRepository.registerUser("user-1", "user1@example.com", "User One");

    const result = await service.invite(ADMIN, BOARD, {
      email: "user1@example.com",
      role: "administrador",
    });

    expect(result).toEqual({
      userId: "user-1",
      name: "User One",
      email: "user1@example.com",
      role: "administrador",
      boardId: BOARD,
    });
    const membership = await boardMemberRepository.findByBoardAndUser(BOARD, "user-1");
    expect(membership?.role).toBe("administrador");
  });

  it("adds an existing user as membro (critério 2)", async () => {
    const { service, boardMemberRepository, userRepository } = buildService();
    await withAdmin(boardMemberRepository);
    userRepository.registerUser("user-1", "user1@example.com");

    const result = await service.invite(ADMIN, BOARD, { email: "user1@example.com", role: "membro" });

    expect(result.role).toBe("membro");
  });

  it("rejects an email with no registered user (critério 3)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);

    await expect(
      service.invite(ADMIN, BOARD, { email: "ghost@example.com", role: "membro" }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("rejects adding a user who is already a member (critério 4)", async () => {
    const { service, boardMemberRepository, userRepository } = buildService();
    await withAdmin(boardMemberRepository);
    userRepository.registerUser("user-1", "user1@example.com");
    await boardMemberRepository.create({ boardId: BOARD, userId: "user-1", role: "membro" });

    await expect(
      service.invite(ADMIN, BOARD, { email: "user1@example.com", role: "administrador" }),
    ).rejects.toBeInstanceOf(MemberAlreadyExistsError);
  });

  it("rejects when the caller is a member but not an administrator (critério 5)", async () => {
    const { service, boardMemberRepository, userRepository } = buildService();
    await withAdmin(boardMemberRepository);
    await boardMemberRepository.create({ boardId: BOARD, userId: MEMBER, role: "membro" });
    userRepository.registerUser("user-1", "user1@example.com");

    await expect(
      service.invite(MEMBER, BOARD, { email: "user1@example.com", role: "membro" }),
    ).rejects.toBeInstanceOf(ForbiddenRoleError);
  });

  it("rejects when the caller is not a member of the board (critério 7)", async () => {
    const { service } = buildService();

    await expect(
      service.invite(OUTSIDER, BOARD, { email: "user1@example.com", role: "membro" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("checks the caller's role before looking up the invited e-mail (RN-17, segurança)", async () => {
    const { service, boardMemberRepository, userRepository } = buildService();
    await withAdmin(boardMemberRepository);
    await boardMemberRepository.create({ boardId: BOARD, userId: MEMBER, role: "membro" });
    const findByEmail = jest.spyOn(userRepository, "findByEmail");

    await expect(
      service.invite(MEMBER, BOARD, { email: "ghost@example.com", role: "membro" }),
    ).rejects.toBeInstanceOf(ForbiddenRoleError);
    expect(findByEmail).not.toHaveBeenCalled();
  });
});

describe("BoardsMembersService.list (critérios 8, 9)", () => {
  it("returns every member and their role to any member (critério 8)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);
    await boardMemberRepository.create({ boardId: BOARD, userId: MEMBER, role: "membro" });

    const members = await service.list(MEMBER, BOARD);

    expect(members).toHaveLength(2);
    expect(members.map((m) => m.role).sort()).toEqual(["administrador", "membro"]);
  });

  it("rejects when the caller is not a member of the board (critério 9)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);

    await expect(service.list(OUTSIDER, BOARD)).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});

describe("BoardsMembersService.updateRole (RN-06, RN-08, critérios 10-14)", () => {
  it("promotes a membro to administrador (critério 10)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);
    await boardMemberRepository.create({ boardId: BOARD, userId: MEMBER, role: "membro" });

    const updated = await service.updateRole(ADMIN, BOARD, MEMBER, { role: "administrador" });

    expect(updated.role).toBe("administrador");
  });

  it("demotes an administrador to membro when another administrador remains (critério 11)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);
    await boardMemberRepository.create({ boardId: BOARD, userId: OTHER_ADMIN, role: "administrador" });

    const updated = await service.updateRole(ADMIN, BOARD, OTHER_ADMIN, { role: "membro" });

    expect(updated.role).toBe("membro");
  });

  it("rejects demoting the sole administrador (critério 12)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);

    await expect(
      service.updateRole(ADMIN, BOARD, ADMIN, { role: "membro" }),
    ).rejects.toBeInstanceOf(LastAdministratorError);
  });

  it("rejects when the caller is not an administrator (critério 13)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);
    await boardMemberRepository.create({ boardId: BOARD, userId: MEMBER, role: "membro" });

    await expect(
      service.updateRole(MEMBER, BOARD, ADMIN, { role: "membro" }),
    ).rejects.toBeInstanceOf(ForbiddenRoleError);
  });

  it("rejects altering the role of a user who is not a member of the board (critério 14)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);

    await expect(
      service.updateRole(ADMIN, BOARD, OUTSIDER, { role: "administrador" }),
    ).rejects.toBeInstanceOf(MemberNotFoundError);
  });
});

describe("BoardsMembersService.remove (RN-06, RN-08, RN-15, critérios 15-18, 31)", () => {
  it("removes another member and cascades their card assignments (critério 15, RN-15, critério 31)", async () => {
    const { service, boardMemberRepository, cardAssignmentRepository } = buildService();
    await withAdmin(boardMemberRepository);
    await boardMemberRepository.create({ boardId: BOARD, userId: MEMBER, role: "membro" });

    await service.remove(ADMIN, BOARD, MEMBER);

    expect(await boardMemberRepository.findByBoardAndUser(BOARD, MEMBER)).toBeNull();
    expect(cardAssignmentRepository.deletedForBoardAndUser).toEqual([
      { boardId: BOARD, userId: MEMBER },
    ]);
  });

  it("rejects removing the sole administrator, even by themselves (critério 16)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);

    await expect(service.remove(ADMIN, BOARD, ADMIN)).rejects.toBeInstanceOf(
      LastAdministratorError,
    );
  });

  it("rejects when the caller is not an administrator (critério 17)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);
    await boardMemberRepository.create({ boardId: BOARD, userId: MEMBER, role: "membro" });
    await boardMemberRepository.create({ boardId: BOARD, userId: OTHER_ADMIN, role: "administrador" });

    await expect(service.remove(MEMBER, BOARD, OTHER_ADMIN)).rejects.toBeInstanceOf(
      ForbiddenRoleError,
    );
  });

  it("rejects removing a user who is not a member of the board (critério 18)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);

    await expect(service.remove(ADMIN, BOARD, OUTSIDER)).rejects.toBeInstanceOf(
      MemberNotFoundError,
    );
  });
});

describe("BoardsMembersService.leave (RN-07, RN-08, RN-15, critérios 19, 20)", () => {
  it("lets a non-sole-administrator member leave the board (critério 19)", async () => {
    const { service, boardMemberRepository, cardAssignmentRepository } = buildService();
    await withAdmin(boardMemberRepository);
    await boardMemberRepository.create({ boardId: BOARD, userId: MEMBER, role: "membro" });

    await service.leave(MEMBER, BOARD);

    expect(await boardMemberRepository.findByBoardAndUser(BOARD, MEMBER)).toBeNull();
    expect(cardAssignmentRepository.deletedForBoardAndUser).toEqual([
      { boardId: BOARD, userId: MEMBER },
    ]);
  });

  it("rejects the sole administrator leaving (critério 20)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);

    await expect(service.leave(ADMIN, BOARD)).rejects.toBeInstanceOf(LastAdministratorError);
  });

  it("allows a non-sole administrator to leave (RN-08)", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);
    await boardMemberRepository.create({ boardId: BOARD, userId: OTHER_ADMIN, role: "administrador" });

    await service.leave(ADMIN, BOARD);

    expect(await boardMemberRepository.findByBoardAndUser(BOARD, ADMIN)).toBeNull();
  });

  it("rejects leaving a board the caller is not a member of", async () => {
    const { service, boardMemberRepository } = buildService();
    await withAdmin(boardMemberRepository);

    await expect(service.leave(OUTSIDER, BOARD)).rejects.toBeInstanceOf(BoardNotFoundError);
  });
});
