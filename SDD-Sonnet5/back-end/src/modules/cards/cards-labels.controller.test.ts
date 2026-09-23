import { Request, Response } from "express";
import { buildCardsLabelsController } from "./cards-labels.controller";
import { CardsLabelsService } from "./cards-labels.service";
import { CardLabelNotFoundError } from "./cards-labels.errors";
import { CardNotFoundError } from "./cards.errors";
import { LabelNotFoundError } from "../labels/labels.errors";
import { Label } from "../labels/entities/label.entity";

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

function fakeService(overrides: Partial<CardsLabelsService> = {}): CardsLabelsService {
  return {
    associate: jest.fn(),
    dissociate: jest.fn(),
    ...overrides,
  } as unknown as CardsLabelsService;
}

const ROUTE_PARAMS = { boardId: "board-1", listId: "list-1", cardId: "card-1" };

const label: Label = {
  id: "label-1",
  boardId: "board-1",
  name: "Urgente",
  color: "vermelho",
  board: undefined as unknown as Label["board"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("cards-labels.controller — associate (critérios 17, 20, 21)", () => {
  it("returns 201 with the associated label's data (critério 17)", async () => {
    const service = fakeService({ associate: jest.fn().mockResolvedValue(label) });
    const controller = buildCardsLabelsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: { labelId: "label-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.associate(req, res, next);

    expect(service.associate).toHaveBeenCalledWith(
      "member-1",
      "board-1",
      "list-1",
      "card-1",
      "label-1",
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "label-1", name: "Urgente", color: "vermelho" });
  });

  it("forwards a validation error without calling the service when labelId is missing", async () => {
    const service = fakeService();
    const controller = buildCardsLabelsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: {} });
    const res = buildRes();
    const next = jest.fn();

    await controller.associate(req, res, next);

    expect(service.associate).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: "validation_error" }),
    );
  });

  it("forwards LabelNotFoundError as 404 (critério 20)", async () => {
    const service = fakeService({
      associate: jest.fn().mockRejectedValue(new LabelNotFoundError()),
    });
    const controller = buildCardsLabelsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: { labelId: "foreign-label" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.associate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "label_not_found" }),
    );
  });

  it("forwards CardNotFoundError as 404 (critério 21)", async () => {
    const service = fakeService({ associate: jest.fn().mockRejectedValue(new CardNotFoundError()) });
    const controller = buildCardsLabelsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: { labelId: "label-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.associate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "card_not_found" }),
    );
  });
});

describe("cards-labels.controller — dissociate (critérios 22, 23)", () => {
  it("returns 204 on success (critério 22)", async () => {
    const service = fakeService({ dissociate: jest.fn().mockResolvedValue(undefined) });
    const controller = buildCardsLabelsController(service);
    const req = buildReq({ params: { ...ROUTE_PARAMS, labelId: "label-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.dissociate(req, res, next);

    expect(service.dissociate).toHaveBeenCalledWith(
      "member-1",
      "board-1",
      "list-1",
      "card-1",
      "label-1",
    );
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("forwards CardLabelNotFoundError as 404 for a label not currently associated (critério 23)", async () => {
    const service = fakeService({
      dissociate: jest.fn().mockRejectedValue(new CardLabelNotFoundError()),
    });
    const controller = buildCardsLabelsController(service);
    const req = buildReq({ params: { ...ROUTE_PARAMS, labelId: "label-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.dissociate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "card_label_not_found" }),
    );
  });
});
