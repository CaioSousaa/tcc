import { Request, Response } from "express";
import { buildListsController } from "./lists.controller";
import { ListsService } from "./lists.service";
import { ListNotFoundError } from "./lists.errors";
import { BoardNotFoundError } from "../boards/boards.errors";
import { ValidationError } from "../../shared/errors";
import { List } from "./entities/list.entity";

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

function fakeService(overrides: Partial<ListsService> = {}): ListsService {
  return {
    create: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  } as unknown as ListsService;
}

const list: List = {
  id: "list-1",
  name: "A Fazer",
  boardId: "board-1",
  board: undefined as unknown as List["board"],
  position: 0,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("lists.controller — create (critérios 1, 2, 5)", () => {
  it("returns 201 with the serialized list on success (critério 1)", async () => {
    const service = fakeService({ create: jest.fn().mockResolvedValue(list) });
    const controller = buildListsController(service);
    const req = buildReq({ params: { boardId: "board-1" }, body: { name: "A Fazer" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(service.create).toHaveBeenCalledWith("owner-1", "board-1", { name: "A Fazer" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: list.id,
      name: list.name,
      boardId: list.boardId,
      position: list.position,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    });
  });

  it("forwards a validation error without calling the service when name is missing (critério 2)", async () => {
    const service = fakeService();
    const controller = buildListsController(service);
    const req = buildReq({ params: { boardId: "board-1" }, body: {} });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(service.create).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: "validation_error" }),
    );
  });

  it("forwards BoardNotFoundError as 404 for a missing or foreign board (critério 5)", async () => {
    const service = fakeService({ create: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildListsController(service);
    const req = buildReq({ params: { boardId: "board-1" }, body: { name: "A Fazer" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "board_not_found" }),
    );
  });
});

describe("lists.controller — list (critérios 7, 8, 9)", () => {
  it("returns lists wrapped in { lists }", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([list]) });
    const controller = buildListsController(service);
    const req = buildReq({ params: { boardId: "board-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(service.list).toHaveBeenCalledWith("owner-1", "board-1");
    expect(res.json).toHaveBeenCalledWith({
      lists: [
        {
          id: list.id,
          name: list.name,
          boardId: list.boardId,
          position: list.position,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        },
      ],
    });
  });

  it("returns an empty list, not an error (critério 8)", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([]) });
    const controller = buildListsController(service);
    const req = buildReq({ params: { boardId: "board-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ lists: [] });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards BoardNotFoundError as 404 (critério 9)", async () => {
    const service = fakeService({ list: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildListsController(service);
    const req = buildReq({ params: { boardId: "board-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "board_not_found" }),
    );
  });
});

describe("lists.controller — update (critérios 10, 12, 16, 17)", () => {
  it("returns 200 with the updated list on success", async () => {
    const service = fakeService({ update: jest.fn().mockResolvedValue(list) });
    const controller = buildListsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { name: "Novo nome" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(service.update).toHaveBeenCalledWith("owner-1", "board-1", "list-1", {
      name: "Novo nome",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("forwards a validation error for an empty name without calling the service", async () => {
    const service = fakeService();
    const controller = buildListsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { name: "" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(service.update).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it("forwards ListNotFoundError as 404 (critério 12)", async () => {
    const service = fakeService({ update: jest.fn().mockRejectedValue(new ListNotFoundError()) });
    const controller = buildListsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" }, body: { name: "X" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "list_not_found" }),
    );
  });

  it("forwards an out-of-range position as a 400 validation error (critério 16)", async () => {
    const service = fakeService({
      update: jest.fn().mockRejectedValue(new ValidationError({ position: "out of range" })),
    });
    const controller = buildListsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { position: 99 },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: "validation_error" }),
    );
  });
});

describe("lists.controller — remove (critérios 18, 20, 21)", () => {
  it("returns 204 on success (critério 18)", async () => {
    const service = fakeService({ remove: jest.fn().mockResolvedValue(undefined) });
    const controller = buildListsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.remove(req, res, next);

    expect(service.remove).toHaveBeenCalledWith("owner-1", "board-1", "list-1");
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("forwards ListNotFoundError as 404 for a missing, foreign, or already-deleted list (critérios 20, 21)", async () => {
    const service = fakeService({ remove: jest.fn().mockRejectedValue(new ListNotFoundError()) });
    const controller = buildListsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.remove(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "list_not_found" }),
    );
  });
});
