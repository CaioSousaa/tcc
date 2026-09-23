import { Request, Response } from "express";
import { buildChecklistsController } from "./checklists.controller";
import { ChecklistsService } from "./checklists.service";
import { ChecklistNotFoundError, ItemNotFoundError } from "./checklists.errors";
import { CardNotFoundError } from "../cards/cards.errors";
import { Checklist } from "./entities/checklist.entity";
import { ChecklistItem } from "./entities/checklist-item.entity";

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

function fakeService(overrides: Partial<ChecklistsService> = {}): ChecklistsService {
  return {
    createChecklist: jest.fn(),
    listChecklists: jest.fn(),
    deleteChecklist: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    ...overrides,
  } as unknown as ChecklistsService;
}

const checklist: Checklist = {
  id: "checklist-1",
  name: "A Fazer",
  cardId: "card-1",
  card: undefined as unknown as Checklist["card"],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const item: ChecklistItem = {
  id: "item-1",
  text: "Comprar leite",
  completed: false,
  checklistId: "checklist-1",
  checklist: undefined as unknown as ChecklistItem["checklist"],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("checklists.controller — createChecklist (critérios 1, 2, 5)", () => {
  it("returns 201 with the serialized checklist on success (critério 1)", async () => {
    const service = fakeService({ createChecklist: jest.fn().mockResolvedValue(checklist) });
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: "card-1" },
      body: { name: "A Fazer" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.createChecklist(req, res, next);

    expect(service.createChecklist).toHaveBeenCalledWith("owner-1", "board-1", "list-1", "card-1", {
      name: "A Fazer",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: checklist.id,
      name: checklist.name,
      cardId: checklist.cardId,
      items: [],
      createdAt: checklist.createdAt,
      updatedAt: checklist.updatedAt,
    });
  });

  it("forwards a validation error without calling the service when name is missing (critério 2)", async () => {
    const service = fakeService();
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: "card-1" },
      body: {},
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.createChecklist(req, res, next);

    expect(service.createChecklist).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: "validation_error" }),
    );
  });

  it("forwards CardNotFoundError as 404 (critério 5)", async () => {
    const service = fakeService({
      createChecklist: jest.fn().mockRejectedValue(new CardNotFoundError()),
    });
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: "card-1" },
      body: { name: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.createChecklist(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "card_not_found" }),
    );
  });
});

describe("checklists.controller — listChecklists", () => {
  it("returns checklists wrapped in { checklists }, items nested", async () => {
    const service = fakeService({
      listChecklists: jest.fn().mockResolvedValue([{ ...checklist, items: [item] }]),
    });
    const controller = buildChecklistsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1", cardId: "card-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.listChecklists(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      checklists: [
        {
          id: checklist.id,
          name: checklist.name,
          cardId: checklist.cardId,
          items: [
            {
              id: item.id,
              text: item.text,
              completed: item.completed,
              checklistId: item.checklistId,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            },
          ],
          createdAt: checklist.createdAt,
          updatedAt: checklist.updatedAt,
        },
      ],
    });
  });

  it("returns an empty list, not an error", async () => {
    const service = fakeService({ listChecklists: jest.fn().mockResolvedValue([]) });
    const controller = buildChecklistsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1", cardId: "card-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.listChecklists(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ checklists: [] });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("checklists.controller — deleteChecklist (critério 24)", () => {
  it("returns 204 on success", async () => {
    const service = fakeService({ deleteChecklist: jest.fn().mockResolvedValue(undefined) });
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: "card-1", checklistId: "checklist-1" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.deleteChecklist(req, res, next);

    expect(service.deleteChecklist).toHaveBeenCalledWith(
      "owner-1",
      "board-1",
      "list-1",
      "card-1",
      "checklist-1",
    );
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("forwards ChecklistNotFoundError as 404", async () => {
    const service = fakeService({
      deleteChecklist: jest.fn().mockRejectedValue(new ChecklistNotFoundError()),
    });
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: "card-1", checklistId: "checklist-1" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.deleteChecklist(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "checklist_not_found" }),
    );
  });
});

describe("checklists.controller — createItem (critérios 7, 8, 10)", () => {
  it("returns 201 with the serialized item on success", async () => {
    const service = fakeService({ createItem: jest.fn().mockResolvedValue(item) });
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: "card-1", checklistId: "checklist-1" },
      body: { text: "Comprar leite" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.createItem(req, res, next);

    expect(service.createItem).toHaveBeenCalledWith(
      "owner-1",
      "board-1",
      "list-1",
      "card-1",
      "checklist-1",
      { text: "Comprar leite" },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("forwards a validation error without calling the service when text is missing", async () => {
    const service = fakeService();
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: "card-1", checklistId: "checklist-1" },
      body: {},
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.createItem(req, res, next);

    expect(service.createItem).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it("forwards ChecklistNotFoundError as 404 (critério 10)", async () => {
    const service = fakeService({
      createItem: jest.fn().mockRejectedValue(new ChecklistNotFoundError()),
    });
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: "card-1", checklistId: "checklist-1" },
      body: { text: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.createItem(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "checklist_not_found" }),
    );
  });
});

describe("checklists.controller — updateItem (critérios 12, 13, 14)", () => {
  it("returns 200 with the updated item on success", async () => {
    const service = fakeService({ updateItem: jest.fn().mockResolvedValue({ ...item, completed: true }) });
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: {
        boardId: "board-1",
        listId: "list-1",
        cardId: "card-1",
        checklistId: "checklist-1",
        itemId: "item-1",
      },
      body: { completed: true },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.updateItem(req, res, next);

    expect(service.updateItem).toHaveBeenCalledWith(
      "owner-1",
      "board-1",
      "list-1",
      "card-1",
      "checklist-1",
      "item-1",
      { completed: true },
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("forwards a validation error when completed is missing", async () => {
    const service = fakeService();
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: {
        boardId: "board-1",
        listId: "list-1",
        cardId: "card-1",
        checklistId: "checklist-1",
        itemId: "item-1",
      },
      body: {},
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.updateItem(req, res, next);

    expect(service.updateItem).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it("forwards ItemNotFoundError as 404 (critério 14)", async () => {
    const service = fakeService({ updateItem: jest.fn().mockRejectedValue(new ItemNotFoundError()) });
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: {
        boardId: "board-1",
        listId: "list-1",
        cardId: "card-1",
        checklistId: "checklist-1",
        itemId: "item-1",
      },
      body: { completed: true },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.updateItem(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "item_not_found" }),
    );
  });
});

describe("checklists.controller — deleteItem (critérios 21, 22)", () => {
  it("returns 204 on success", async () => {
    const service = fakeService({ deleteItem: jest.fn().mockResolvedValue(undefined) });
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: {
        boardId: "board-1",
        listId: "list-1",
        cardId: "card-1",
        checklistId: "checklist-1",
        itemId: "item-1",
      },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.deleteItem(req, res, next);

    expect(service.deleteItem).toHaveBeenCalledWith(
      "owner-1",
      "board-1",
      "list-1",
      "card-1",
      "checklist-1",
      "item-1",
    );
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("forwards ItemNotFoundError as 404 for a missing or already-deleted item (critério 22)", async () => {
    const service = fakeService({ deleteItem: jest.fn().mockRejectedValue(new ItemNotFoundError()) });
    const controller = buildChecklistsController(service);
    const req = buildReq({
      params: {
        boardId: "board-1",
        listId: "list-1",
        cardId: "card-1",
        checklistId: "checklist-1",
        itemId: "item-1",
      },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.deleteItem(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "item_not_found" }),
    );
  });
});
