import { Request, Response } from "express";
import { buildLabelsController } from "./labels.controller";
import { LabelsService } from "./labels.service";
import { LabelNotFoundError } from "./labels.errors";
import { BoardNotFoundError } from "../boards/boards.errors";
import { Label } from "./entities/label.entity";

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
    user: { id: "member-1", email: "member@example.com" },
    ...overrides,
  } as unknown as Request;
}

function fakeService(overrides: Partial<LabelsService> = {}): LabelsService {
  return {
    create: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  } as unknown as LabelsService;
}

const label: Label = {
  id: "label-1",
  boardId: "board-1",
  name: "Urgente",
  color: "vermelho",
  board: undefined as unknown as Label["board"],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("labels.controller — create (critérios 1, 2, 4, 7)", () => {
  it("returns 201 with the serialized label on success (critério 1)", async () => {
    const service = fakeService({ create: jest.fn().mockResolvedValue(label) });
    const controller = buildLabelsController(service);
    const req = buildReq({
      params: { boardId: "board-1" },
      body: { name: "Urgente", color: "vermelho" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(service.create).toHaveBeenCalledWith("member-1", "board-1", {
      name: "Urgente",
      color: "vermelho",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: label.id,
      name: label.name,
      color: label.color,
      boardId: label.boardId,
      createdAt: label.createdAt,
      updatedAt: label.updatedAt,
    });
  });

  it("forwards a validation error without calling the service for an invalid color", async () => {
    const service = fakeService();
    const controller = buildLabelsController(service);
    const req = buildReq({
      params: { boardId: "board-1" },
      body: { name: "X", color: "rosa" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(service.create).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: "validation_error" }),
    );
  });

  it("forwards BoardNotFoundError as 404 (critério 7)", async () => {
    const service = fakeService({ create: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildLabelsController(service);
    const req = buildReq({
      params: { boardId: "board-1" },
      body: { name: "X", color: "verde" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "board_not_found" }),
    );
  });
});

describe("labels.controller — list (critérios 8, 9, 10)", () => {
  it("returns labels wrapped in { labels }", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([label]) });
    const controller = buildLabelsController(service);
    const req = buildReq({ params: { boardId: "board-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(service.list).toHaveBeenCalledWith("member-1", "board-1");
    expect(res.json).toHaveBeenCalledWith({
      labels: [
        {
          id: label.id,
          name: label.name,
          color: label.color,
          boardId: label.boardId,
          createdAt: label.createdAt,
          updatedAt: label.updatedAt,
        },
      ],
    });
  });

  it("returns an empty list, not an error (critério 9)", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([]) });
    const controller = buildLabelsController(service);
    const req = buildReq({ params: { boardId: "board-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ labels: [] });
  });

  it("forwards BoardNotFoundError as 404 (critério 10)", async () => {
    const service = fakeService({ list: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildLabelsController(service);
    const req = buildReq({ params: { boardId: "board-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "board_not_found" }),
    );
  });
});

describe("labels.controller — update (critérios 11, 13, 14)", () => {
  it("returns 200 with the updated label on success", async () => {
    const service = fakeService({ update: jest.fn().mockResolvedValue(label) });
    const controller = buildLabelsController(service);
    const req = buildReq({
      params: { boardId: "board-1", labelId: label.id },
      body: { name: "Novo nome" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(service.update).toHaveBeenCalledWith("member-1", "board-1", label.id, {
      name: "Novo nome",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("forwards a validation error for an empty payload without calling the service", async () => {
    const service = fakeService();
    const controller = buildLabelsController(service);
    const req = buildReq({ params: { boardId: "board-1", labelId: label.id }, body: {} });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(service.update).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it("forwards LabelNotFoundError as 404 (critério 13)", async () => {
    const service = fakeService({ update: jest.fn().mockRejectedValue(new LabelNotFoundError()) });
    const controller = buildLabelsController(service);
    const req = buildReq({
      params: { boardId: "board-1", labelId: label.id },
      body: { name: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "label_not_found" }),
    );
  });
});

describe("labels.controller — remove (critérios 15, 16)", () => {
  it("returns 204 on success (critério 15)", async () => {
    const service = fakeService({ remove: jest.fn().mockResolvedValue(undefined) });
    const controller = buildLabelsController(service);
    const req = buildReq({ params: { boardId: "board-1", labelId: label.id } });
    const res = buildRes();
    const next = jest.fn();

    await controller.remove(req, res, next);

    expect(service.remove).toHaveBeenCalledWith("member-1", "board-1", label.id);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("forwards LabelNotFoundError as 404 for a missing, foreign, or already-deleted label (critério 16)", async () => {
    const service = fakeService({ remove: jest.fn().mockRejectedValue(new LabelNotFoundError()) });
    const controller = buildLabelsController(service);
    const req = buildReq({ params: { boardId: "board-1", labelId: label.id } });
    const res = buildRes();
    const next = jest.fn();

    await controller.remove(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "label_not_found" }),
    );
  });
});
