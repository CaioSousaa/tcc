import { Request, Response } from "express";
import { buildCardsAssignmentsController } from "./cards-assignments.controller";
import { CardsAssignmentsService } from "./cards-assignments.service";
import { AssignmentNotFoundError } from "./cards-assignments.errors";
import { CardNotFoundError } from "./cards.errors";
import { ForbiddenRoleError, MemberNotFoundError } from "../boards/boards-members.errors";

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

function fakeService(overrides: Partial<CardsAssignmentsService> = {}): CardsAssignmentsService {
  return {
    assign: jest.fn(),
    unassign: jest.fn(),
    ...overrides,
  } as unknown as CardsAssignmentsService;
}

const ROUTE_PARAMS = { boardId: "board-1", listId: "list-1", cardId: "card-1" };

describe("cards-assignments.controller — assign (critérios 21, 24, 25)", () => {
  it("returns 201 on success, with the assigned member's data (critério 21)", async () => {
    const assigned = { userId: "member-1", name: "Member One", email: "m1@example.com" };
    const service = fakeService({ assign: jest.fn().mockResolvedValue(assigned) });
    const controller = buildCardsAssignmentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: { userId: "member-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.assign(req, res, next);

    expect(service.assign).toHaveBeenCalledWith("admin-1", "board-1", "list-1", "card-1", "member-1");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ ...assigned, cardId: "card-1" });
  });

  it("forwards a validation error without calling the service when userId is missing", async () => {
    const service = fakeService();
    const controller = buildCardsAssignmentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: {} });
    const res = buildRes();
    const next = jest.fn();

    await controller.assign(req, res, next);

    expect(service.assign).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, code: "validation_error" }));
  });

  it("forwards MemberNotFoundError as 404 (critério 24)", async () => {
    const service = fakeService({ assign: jest.fn().mockRejectedValue(new MemberNotFoundError()) });
    const controller = buildCardsAssignmentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: { userId: "outsider-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.assign(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: "member_not_found" }));
  });

  it("forwards ForbiddenRoleError as 403 (critério 25)", async () => {
    const service = fakeService({ assign: jest.fn().mockRejectedValue(new ForbiddenRoleError()) });
    const controller = buildCardsAssignmentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: { userId: "member-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.assign(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, code: "forbidden_role" }));
  });

  it("forwards CardNotFoundError as 404 for a foreign or missing card", async () => {
    const service = fakeService({ assign: jest.fn().mockRejectedValue(new CardNotFoundError()) });
    const controller = buildCardsAssignmentsController(service);
    const req = buildReq({ params: ROUTE_PARAMS, body: { userId: "member-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.assign(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: "card_not_found" }));
  });
});

describe("cards-assignments.controller — unassign (critério 23)", () => {
  it("returns 204 on success (critério 23)", async () => {
    const service = fakeService({ unassign: jest.fn().mockResolvedValue(undefined) });
    const controller = buildCardsAssignmentsController(service);
    const req = buildReq({ params: { ...ROUTE_PARAMS, userId: "member-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.unassign(req, res, next);

    expect(service.unassign).toHaveBeenCalledWith("admin-1", "board-1", "list-1", "card-1", "member-1");
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("forwards AssignmentNotFoundError as 404 for a user not currently assigned", async () => {
    const service = fakeService({
      unassign: jest.fn().mockRejectedValue(new AssignmentNotFoundError()),
    });
    const controller = buildCardsAssignmentsController(service);
    const req = buildReq({ params: { ...ROUTE_PARAMS, userId: "member-1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.unassign(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "assignment_not_found" }),
    );
  });
});
