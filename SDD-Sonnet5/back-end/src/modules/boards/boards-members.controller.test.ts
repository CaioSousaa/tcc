import { Request, Response } from "express";
import { buildBoardsMembersController } from "./boards-members.controller";
import { BoardsMembersService } from "./boards-members.service";
import { BoardNotFoundError } from "./boards.errors";
import {
  ForbiddenRoleError,
  LastAdministratorError,
  MemberAlreadyExistsError,
  MemberNotFoundError,
  UserNotFoundError,
} from "./boards-members.errors";
import { BoardMember } from "./entities/board-member.entity";

function buildRes() {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

function buildReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    user: { id: "admin-1", email: "admin@example.com" },
    ...overrides,
  } as unknown as Request;
}

function fakeService(overrides: Partial<BoardsMembersService> = {}): BoardsMembersService {
  return {
    invite: jest.fn(),
    list: jest.fn(),
    updateRole: jest.fn(),
    remove: jest.fn(),
    leave: jest.fn(),
    ...overrides,
  } as unknown as BoardsMembersService;
}

const membership: BoardMember = {
  id: "membership-1",
  boardId: "board-1",
  userId: "member-1",
  role: "membro",
  board: undefined as unknown as BoardMember["board"],
  user: undefined as unknown as BoardMember["user"],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("boards-members.controller — invite (critérios 1, 2, 3, 4, 5, 6, 7)", () => {
  it("returns 201 with the invited member on success (critérios 1, 2)", async () => {
    const invited = {
      userId: "user-1",
      name: "User One",
      email: "user1@example.com",
      role: "administrador" as const,
      boardId: "board-1",
    };
    const service = fakeService({ invite: jest.fn().mockResolvedValue(invited) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({
      params: { boardId: "board-1" },
      body: { email: "user1@example.com", role: "administrador" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.invite(req, res, next);

    expect(service.invite).toHaveBeenCalledWith("admin-1", "board-1", {
      email: "user1@example.com",
      role: "administrador",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(invited);
  });

  it("forwards a validation error without calling the service for a malformed e-mail", async () => {
    const service = fakeService();
    const controller = buildBoardsMembersController(service);
    const req = buildReq({ params: { boardId: "board-1" }, body: { email: "x", role: "membro" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.invite(req, res, next);

    expect(service.invite).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, code: "validation_error" }));
  });

  it("forwards UserNotFoundError as 404 (critério 3)", async () => {
    const service = fakeService({ invite: jest.fn().mockRejectedValue(new UserNotFoundError()) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({
      params: { boardId: "board-1" },
      body: { email: "ghost@example.com", role: "membro" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.invite(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: "user_not_found" }));
  });

  it("forwards MemberAlreadyExistsError as 409 (critério 4)", async () => {
    const service = fakeService({
      invite: jest.fn().mockRejectedValue(new MemberAlreadyExistsError()),
    });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({
      params: { boardId: "board-1" },
      body: { email: "user1@example.com", role: "membro" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.invite(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, code: "member_already_exists" }),
    );
  });

  it("forwards ForbiddenRoleError as 403 (critério 5)", async () => {
    const service = fakeService({ invite: jest.fn().mockRejectedValue(new ForbiddenRoleError()) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({
      params: { boardId: "board-1" },
      body: { email: "user1@example.com", role: "membro" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.invite(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, code: "forbidden_role" }));
  });

  it("forwards BoardNotFoundError as 404 (critério 7)", async () => {
    const service = fakeService({ invite: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({
      params: { boardId: "board-1" },
      body: { email: "user1@example.com", role: "membro" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.invite(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: "board_not_found" }));
  });
});

describe("boards-members.controller — list (critérios 8, 9)", () => {
  it("returns members wrapped in { members } (critério 8)", async () => {
    const memberInfo = { userId: "member-1", name: "Member One", email: "m1@example.com", role: "membro" as const };
    const service = fakeService({ list: jest.fn().mockResolvedValue([memberInfo]) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({ params: { boardId: "board-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(service.list).toHaveBeenCalledWith("admin-1", "board-1");
    expect(res.json).toHaveBeenCalledWith({ members: [memberInfo] });
  });

  it("forwards BoardNotFoundError as 404 (critério 9)", async () => {
    const service = fakeService({ list: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({ params: { boardId: "board-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: "board_not_found" }));
  });
});

describe("boards-members.controller — updateRole (critérios 10, 12, 13, 14)", () => {
  it("returns 200 with the updated membership on success", async () => {
    const service = fakeService({ updateRole: jest.fn().mockResolvedValue(membership) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({
      params: { boardId: "board-1", memberId: "member-1" },
      body: { role: "administrador" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.updateRole(req, res, next);

    expect(service.updateRole).toHaveBeenCalledWith("admin-1", "board-1", "member-1", {
      role: "administrador",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ userId: "member-1", role: "membro", boardId: "board-1" });
  });

  it("forwards LastAdministratorError as 409 (critério 12)", async () => {
    const service = fakeService({
      updateRole: jest.fn().mockRejectedValue(new LastAdministratorError()),
    });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({
      params: { boardId: "board-1", memberId: "admin-1" },
      body: { role: "membro" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.updateRole(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, code: "last_administrator_required" }),
    );
  });

  it("forwards ForbiddenRoleError as 403 (critério 13)", async () => {
    const service = fakeService({ updateRole: jest.fn().mockRejectedValue(new ForbiddenRoleError()) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({
      params: { boardId: "board-1", memberId: "member-1" },
      body: { role: "administrador" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.updateRole(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, code: "forbidden_role" }));
  });

  it("forwards MemberNotFoundError as 404 (critério 14)", async () => {
    const service = fakeService({ updateRole: jest.fn().mockRejectedValue(new MemberNotFoundError()) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({
      params: { boardId: "board-1", memberId: "outsider-1" },
      body: { role: "administrador" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.updateRole(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: "member_not_found" }));
  });
});

describe("boards-members.controller — remove (critérios 15, 16, 17, 18)", () => {
  it("returns 204 on success (critério 15)", async () => {
    const service = fakeService({ remove: jest.fn().mockResolvedValue(undefined) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({ params: { boardId: "board-1", memberId: "member-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.remove(req, res, next);

    expect(service.remove).toHaveBeenCalledWith("admin-1", "board-1", "member-1");
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("forwards LastAdministratorError as 409 (critério 16)", async () => {
    const service = fakeService({ remove: jest.fn().mockRejectedValue(new LastAdministratorError()) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({ params: { boardId: "board-1", memberId: "admin-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.remove(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, code: "last_administrator_required" }),
    );
  });
});

describe("boards-members.controller — leave (critérios 19, 20)", () => {
  it("returns 204 on success (critério 19)", async () => {
    const service = fakeService({ leave: jest.fn().mockResolvedValue(undefined) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({ params: { boardId: "board-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.leave(req, res, next);

    expect(service.leave).toHaveBeenCalledWith("admin-1", "board-1");
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("forwards LastAdministratorError as 409 (critério 20)", async () => {
    const service = fakeService({ leave: jest.fn().mockRejectedValue(new LastAdministratorError()) });
    const controller = buildBoardsMembersController(service);
    const req = buildReq({ params: { boardId: "board-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.leave(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, code: "last_administrator_required" }),
    );
  });
});
