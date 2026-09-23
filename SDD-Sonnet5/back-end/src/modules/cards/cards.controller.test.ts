import { Request, Response } from "express";
import { buildCardsController } from "./cards.controller";
import { CardsService } from "./cards.service";
import { CardNotFoundError } from "./cards.errors";
import { ListNotFoundError } from "../lists/lists.errors";
import { BoardNotFoundError } from "../boards/boards.errors";
import { Card } from "./entities/card.entity";

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
    query: {},
    user: { id: "owner-1", email: "owner@example.com" },
    ...overrides,
  } as unknown as Request;
}

function fakeService(overrides: Partial<CardsService> = {}): CardsService {
  return {
    create: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getProgressForCards: jest.fn().mockResolvedValue({}),
    getAssigneesForCards: jest.fn().mockResolvedValue({}),
    getLabelsForCards: jest.fn().mockResolvedValue({}),
    ...overrides,
  } as unknown as CardsService;
}

const card: Card = {
  id: "card-1",
  title: "Comprar leite",
  description: "2 litros",
  listId: "list-1",
  list: undefined as unknown as Card["list"],
  position: 0,
  dueDate: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("cards.controller — create (critérios 1, 2, 6)", () => {
  it("returns 201 with the serialized card on success (critério 1)", async () => {
    const service = fakeService({ create: jest.fn().mockResolvedValue(card) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { title: "Comprar leite", description: "2 litros" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(service.create).toHaveBeenCalledWith("owner-1", "board-1", "list-1", {
      title: "Comprar leite",
      description: "2 litros",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: card.id,
      title: card.title,
      description: card.description,
      listId: card.listId,
      position: card.position,
      dueDate: null,
      dueDateStatus: null,
      progress: null,
      assignees: [],
      labels: [],
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    });
  });

  it("forwards a validation error without calling the service when title is missing (critério 2)", async () => {
    const service = fakeService();
    const controller = buildCardsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" }, body: {} });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(service.create).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: "validation_error" }),
    );
  });

  it("forwards ListNotFoundError as 404 (critério 6)", async () => {
    const service = fakeService({ create: jest.fn().mockRejectedValue(new ListNotFoundError()) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { title: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "list_not_found" }),
    );
  });

  it("forwards BoardNotFoundError as 404 (critério 6)", async () => {
    const service = fakeService({ create: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { title: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "board_not_found" }),
    );
  });
});

describe("cards.controller — list (critérios 8, 9, 10)", () => {
  it("returns cards wrapped in { cards }, with progress null when the card has no checklist items", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([card]) });
    const controller = buildCardsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(service.list).toHaveBeenCalledWith("owner-1", "board-1", "list-1", undefined, false);
    expect(service.getProgressForCards).toHaveBeenCalledWith([card.id]);
    expect(service.getAssigneesForCards).toHaveBeenCalledWith([card.id]);
    expect(service.getLabelsForCards).toHaveBeenCalledWith([card.id]);
    expect(res.json).toHaveBeenCalledWith({
      cards: [
        {
          id: card.id,
          title: card.title,
          description: card.description,
          listId: card.listId,
          position: card.position,
          dueDate: null,
          dueDateStatus: null,
          progress: null,
          assignees: [],
          labels: [],
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        },
      ],
    });
  });

  it("includes the computed percentage when the card has checklist items (RF06, RN-13)", async () => {
    const service = fakeService({
      list: jest.fn().mockResolvedValue([card]),
      getProgressForCards: jest.fn().mockResolvedValue({ [card.id]: { completed: 1, total: 3 } }),
    });
    const controller = buildCardsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      cards: [
        expect.objectContaining({
          progress: { completed: 1, total: 3, percentage: 33 },
        }),
      ],
    });
  });

  it("reports 100% when every item is completed (RF06, critério 19)", async () => {
    const service = fakeService({
      list: jest.fn().mockResolvedValue([card]),
      getProgressForCards: jest.fn().mockResolvedValue({ [card.id]: { completed: 1, total: 1 } }),
    });
    const controller = buildCardsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      cards: [expect.objectContaining({ progress: { completed: 1, total: 1, percentage: 100 } })],
    });
  });

  it("reports 0% (not omitted) when there is at least one item and none are completed (RF06, critério 20)", async () => {
    const service = fakeService({
      list: jest.fn().mockResolvedValue([card]),
      getProgressForCards: jest.fn().mockResolvedValue({ [card.id]: { completed: 0, total: 1 } }),
    });
    const controller = buildCardsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      cards: [expect.objectContaining({ progress: { completed: 0, total: 1, percentage: 0 } })],
    });
  });

  it("returns an empty list, not an error (critério 9)", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([]) });
    const controller = buildCardsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ cards: [] });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards ListNotFoundError/BoardNotFoundError as 404 (critério 10)", async () => {
    const service = fakeService({ list: jest.fn().mockRejectedValue(new ListNotFoundError()) });
    const controller = buildCardsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "list_not_found" }),
    );
  });
});

describe("cards.controller — update (edição e movimentação, critérios 11, 13, 14, 19, 22)", () => {
  it("returns 200 with the updated card on success", async () => {
    const service = fakeService({ update: jest.fn().mockResolvedValue(card) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: card.id },
      body: { title: "Novo título" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(service.update).toHaveBeenCalledWith("owner-1", "board-1", "list-1", card.id, {
      title: "Novo título",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("forwards a validation error for an empty title without calling the service (critério 13)", async () => {
    const service = fakeService();
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: card.id },
      body: { title: "" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(service.update).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it("forwards CardNotFoundError as 404 (critério 14)", async () => {
    const service = fakeService({ update: jest.fn().mockRejectedValue(new CardNotFoundError()) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: card.id },
      body: { title: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "card_not_found" }),
    );
  });

  it("passes targetListId through to the service for a move (critério 19)", async () => {
    const service = fakeService({ update: jest.fn().mockResolvedValue({ ...card, listId: "list-2" }) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: card.id },
      body: { targetListId: "list-2" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(service.update).toHaveBeenCalledWith("owner-1", "board-1", "list-1", card.id, {
      targetListId: "list-2",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("forwards ListNotFoundError as 404 when the destination list is not accessible (critério 22)", async () => {
    const service = fakeService({ update: jest.fn().mockRejectedValue(new ListNotFoundError()) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1", cardId: card.id },
      body: { targetListId: "list-999" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.update(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "list_not_found" }),
    );
  });
});

describe("cards.controller — remove (critérios 15, 17, 18)", () => {
  it("returns 204 on success (critério 15)", async () => {
    const service = fakeService({ remove: jest.fn().mockResolvedValue(undefined) });
    const controller = buildCardsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1", cardId: card.id } });
    const res = buildRes();
    const next = jest.fn();

    await controller.remove(req, res, next);

    expect(service.remove).toHaveBeenCalledWith("owner-1", "board-1", "list-1", card.id);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("forwards CardNotFoundError as 404 for a missing, foreign, or already-deleted card (critérios 17, 18)", async () => {
    const service = fakeService({ remove: jest.fn().mockRejectedValue(new CardNotFoundError()) });
    const controller = buildCardsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1", cardId: card.id } });
    const res = buildRes();
    const next = jest.fn();

    await controller.remove(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "card_not_found" }),
    );
  });
});

function dateOffsetFromTodayUTC(days: number): string {
  const now = new Date();
  const shifted = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days),
  );
  return shifted.toISOString().slice(0, 10);
}

describe("cards.controller — dueDateStatus (RF10, RN-05, RN-06, RN-07, critérios 10-14)", () => {
  it("marks a card whose due date has passed as overdue (critério 10)", async () => {
    const overdueCard = { ...card, dueDate: dateOffsetFromTodayUTC(-1) };
    const service = fakeService({ create: jest.fn().mockResolvedValue(overdueCard) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { title: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: overdueCard.dueDate, dueDateStatus: "overdue" }),
    );
  });

  it("marks a card due today as due_soon, not overdue (critério 11)", async () => {
    const dueTodayCard = { ...card, dueDate: dateOffsetFromTodayUTC(0) };
    const service = fakeService({ create: jest.fn().mockResolvedValue(dueTodayCard) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { title: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: dueTodayCard.dueDate, dueDateStatus: "due_soon" }),
    );
  });

  it("marks a card due tomorrow as due_soon (critério 12)", async () => {
    const dueTomorrowCard = { ...card, dueDate: dateOffsetFromTodayUTC(1) };
    const service = fakeService({ create: jest.fn().mockResolvedValue(dueTomorrowCard) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { title: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: dueTomorrowCard.dueDate, dueDateStatus: "due_soon" }),
    );
  });

  it("does not highlight a card due after tomorrow (critério 13)", async () => {
    const farCard = { ...card, dueDate: dateOffsetFromTodayUTC(2) };
    const service = fakeService({ create: jest.fn().mockResolvedValue(farCard) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { title: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: farCard.dueDate, dueDateStatus: null }),
    );
  });

  it("recalculates the status as the clock advances, without the card being changed (RN-08, critério 15)", async () => {
    const fixedDueDate = "2026-05-10";
    const cardWithFixedDate = { ...card, dueDate: fixedDueDate };
    const service = fakeService({
      create: jest.fn().mockResolvedValue(cardWithFixedDate),
    });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { title: "X" },
    });

    jest.useFakeTimers().setSystemTime(new Date("2026-05-10T12:00:00.000Z"));
    const resToday = buildRes();
    await controller.create(req, resToday, jest.fn());
    expect(resToday.json).toHaveBeenCalledWith(
      expect.objectContaining({ dueDateStatus: "due_soon" }),
    );

    jest.setSystemTime(new Date("2026-05-11T12:00:00.000Z"));
    const resNextDay = buildRes();
    await controller.create(req, resNextDay, jest.fn());
    expect(resNextDay.json).toHaveBeenCalledWith(
      expect.objectContaining({ dueDateStatus: "overdue" }),
    );

    jest.useRealTimers();
  });

  it("does not highlight a card without a due date (critério 14)", async () => {
    const noDueDateCard = { ...card, dueDate: null };
    const service = fakeService({ create: jest.fn().mockResolvedValue(noDueDateCard) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      body: { title: "X" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: null, dueDateStatus: null }),
    );
  });
});

describe("cards.controller — list ganha ?sortByDueDate= (RF10, RN-10)", () => {
  it("passes sortByDueDate=true through to the service when present", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([]) });
    const controller = buildCardsController(service);
    const req = buildReq({
      params: { boardId: "board-1", listId: "list-1" },
      query: { sortByDueDate: "true" },
    });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(service.list).toHaveBeenCalledWith("owner-1", "board-1", "list-1", undefined, true);
  });

  it("defaults sortByDueDate to false when absent", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([]) });
    const controller = buildCardsController(service);
    const req = buildReq({ params: { boardId: "board-1", listId: "list-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(service.list).toHaveBeenCalledWith("owner-1", "board-1", "list-1", undefined, false);
  });
});
