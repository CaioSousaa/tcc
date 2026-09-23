import { Request, Response } from "express";
import { buildBoardsController } from "./boards.controller";
import { BoardsService } from "./boards.service";
import { BoardNotFoundError } from "./boards.errors";
import { Board } from "./entities/board.entity";

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
    user: { id: "owner-1", email: "owner@example.com" },
    ...overrides,
  } as unknown as Request;
}

function fakeService(overrides: Partial<BoardsService> = {}): BoardsService {
  return {
    create: jest.fn(),
    list: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  } as unknown as BoardsService;
}

const board: Board = {
  id: "board-1",
  name: "Projeto TCC",
  description: "desc",
  ownerId: "owner-1",
  owner: undefined as unknown as Board["owner"],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const boardWithRole = { board, role: "administrador" as const };

describe("boards.controller — create (critérios 1, 2, 4)", () => {
  it("returns 201 with the serialized board on success (critério 1)", async () => {
    const service = fakeService({ create: jest.fn().mockResolvedValue(boardWithRole) });
    const controller = buildBoardsController(service);
    const req = buildReq({ body: { name: "Projeto TCC", description: "desc" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(service.create).toHaveBeenCalledWith("owner-1", { name: "Projeto TCC", description: "desc" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: board.id,
      name: board.name,
      description: board.description,
      role: "administrador",
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    });
  });

  it("forwards a validation error without calling the service when name is missing (critério 2)", async () => {
    const service = fakeService();
    const controller = buildBoardsController(service);
    const req = buildReq({ body: {} });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(service.create).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, code: "validation_error" }));
  });
});

describe("boards.controller — list (RN-08, critérios 6, 7)", () => {
  it("returns only the caller's boards wrapped in { boards }", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([boardWithRole]) });
    const controller = buildBoardsController(service);
    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(service.list).toHaveBeenCalledWith("owner-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      boards: [
        {
          id: board.id,
          name: board.name,
          description: board.description,
          role: "administrador",
          createdAt: board.createdAt,
          updatedAt: board.updatedAt,
        },
      ],
    });
  });

  it("returns an empty list, not an error, when the caller has no boards (critério 7)", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([]) });
    const controller = buildBoardsController(service);
    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ boards: [] });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("boards.controller — getById (RN-06, critérios 9, 10)", () => {
  it("forwards BoardNotFoundError as 404 for a missing or foreign board", async () => {
    const service = fakeService({ getById: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildBoardsController(service);
    const req = buildReq({ params: { id: "some-id" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.getById(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: "board_not_found" }));
  });
});

describe("boards.controller — update (critérios 11, 13, 14)", () => {
  it("returns 200 with the updated board on success", async () => {
    const service = fakeService({ update: jest.fn().mockResolvedValue(boardWithRole) });
    const controller = buildBoardsController(service);
    const req = buildReq({ params: { id: board.id }, body: { name: "Novo nome" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(service.update).toHaveBeenCalledWith("owner-1", board.id, { name: "Novo nome" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("forwards a validation error for an empty name without calling the service (critério 13)", async () => {
    const service = fakeService();
    const controller = buildBoardsController(service);
    const req = buildReq({ params: { id: board.id }, body: { name: "" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(service.update).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it("forwards BoardNotFoundError as 404 for a foreign or missing board (RN-06, critério 14)", async () => {
    const service = fakeService({ update: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildBoardsController(service);
    const req = buildReq({ params: { id: board.id }, body: { name: "Novo nome" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: "board_not_found" }));
  });
});

describe("boards.controller — remove (critérios 15, 16, 17)", () => {
  it("returns 204 on success (critério 15)", async () => {
    const service = fakeService({ remove: jest.fn().mockResolvedValue(undefined) });
    const controller = buildBoardsController(service);
    const req = buildReq({ params: { id: board.id } });
    const res = buildRes();
    const next = jest.fn();

    await controller.remove(req, res, next);

    expect(service.remove).toHaveBeenCalledWith("owner-1", board.id);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("forwards BoardNotFoundError as 404 for a foreign, missing, or already-deleted board (critérios 16, 17)", async () => {
    const service = fakeService({ remove: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildBoardsController(service);
    const req = buildReq({ params: { id: board.id } });
    const res = buildRes();
    const next = jest.fn();

    await controller.remove(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: "board_not_found" }));
  });
});
