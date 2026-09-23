import { NextFunction, Request, RequestHandler, Response } from "express";
import { ValidationError } from "../../shared/errors";
import { UnauthenticatedError } from "../auth/auth.errors";
import { CardsAssignmentsService } from "./cards-assignments.service";
import { assignMemberSchema, formatZodError } from "./cards-assignments.schemas";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
}

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new UnauthenticatedError();
  }
  return req.user.id;
}

function routeParams(req: Request) {
  return {
    boardId: req.params["boardId"] as string,
    listId: req.params["listId"] as string,
    cardId: req.params["cardId"] as string,
  };
}

export function buildCardsAssignmentsController(service: CardsAssignmentsService) {
  const assign = asyncHandler(async (req, res) => {
    const actorId = requireUserId(req);
    const { boardId, listId, cardId } = routeParams(req);
    const parsed = assignMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const assigned = await service.assign(actorId, boardId, listId, cardId, parsed.data.userId);
    res.status(201).json({ ...assigned, cardId });
  });

  const unassign = asyncHandler(async (req, res) => {
    const actorId = requireUserId(req);
    const { boardId, listId, cardId } = routeParams(req);
    const userId = req.params["userId"] as string;

    await service.unassign(actorId, boardId, listId, cardId, userId);
    res.status(204).send();
  });

  return { assign, unassign };
}
