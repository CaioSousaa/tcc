import { Request, Response } from "express";
import { buildCardsCommentsController } from "./cards-comments.controller";
import { CardsCommentsService } from "./cards-comments.service";
import { CardNotFoundError } from "./cards.errors";
import { BoardNotFoundError } from "../boards/boards.errors";
import { CommentWithAuthor } from "./repositories/comment.repository.types";

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

function fakeService(overrides: Partial<CardsCommentsService> = {}): CardsCommentsService {
  return {
    create: jest.fn(),
    list: jest.fn(),
    ...overrides,
  } as unknown as CardsCommentsService;
}

const ROUTE_PARAMS = { boardId: "board-1", listId: "list-1", cardId: "card-1" };

const comment: CommentWithAuthor = {
  id: "comment-1",
  text: "Ótimo trabalho",
  cardId: "card-1",
  author: { id: "member-1", name: "Member One", email: "member@example.com" },
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("cards-comments.controller — create (critérios 1, 5, 6)", () => {
  it("returns 201 with the serialized comment on success (critério 1)", async () => {
    const service = fakeService({ create: jest.fn().mockResolvedValue(comment) });
    const controller = buildCardsCommentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: { text: "Ótimo trabalho" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(service.create).toHaveBeenCalledWith("member-1", "board-1", "list-1", "card-1", {
      text: "Ótimo trabalho",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: comment.id,
      text: comment.text,
      cardId: comment.cardId,
      author: comment.author,
      createdAt: comment.createdAt,
    });
  });

  it("forwards a validation error without calling the service when text is missing", async () => {
    const service = fakeService();
    const controller = buildCardsCommentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: {} });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(service.create).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: "validation_error" }),
    );
  });

  it("forwards BoardNotFoundError as 404 (critério 5)", async () => {
    const service = fakeService({ create: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildCardsCommentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: { text: "X" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "board_not_found" }),
    );
  });

  it("forwards CardNotFoundError as 404 (critério 6)", async () => {
    const service = fakeService({ create: jest.fn().mockRejectedValue(new CardNotFoundError()) });
    const controller = buildCardsCommentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: { text: "X" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "card_not_found" }),
    );
  });
});

describe("cards-comments.controller — list (critérios 7, 8, 10)", () => {
  it("returns comments wrapped in { comments } (critério 7)", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([comment]) });
    const controller = buildCardsCommentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(service.list).toHaveBeenCalledWith("member-1", "board-1", "list-1", "card-1");
    expect(res.json).toHaveBeenCalledWith({
      comments: [
        {
          id: comment.id,
          text: comment.text,
          cardId: comment.cardId,
          author: comment.author,
          createdAt: comment.createdAt,
        },
      ],
    });
  });

  it("returns an empty list, not an error (critério 8)", async () => {
    const service = fakeService({ list: jest.fn().mockResolvedValue([]) });
    const controller = buildCardsCommentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ comments: [] });
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards BoardNotFoundError as 404 (critério 10)", async () => {
    const service = fakeService({ list: jest.fn().mockRejectedValue(new BoardNotFoundError()) });
    const controller = buildCardsCommentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS });
    const res = buildRes();
    const next = jest.fn();

    await controller.list(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "board_not_found" }),
    );
  });
});
