import { NextFunction, Request, RequestHandler, Response } from "express";
import { ValidationError } from "../../shared/errors";
import { UnauthenticatedError } from "../auth/auth.errors";
import { CardsLabelsService } from "./cards-labels.service";
import { associateLabelSchema, formatZodError } from "./cards-labels.schemas";
import { Label } from "../labels/entities/label.entity";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
}

function serializeLabel(label: Label) {
  return { id: label.id, name: label.name, color: label.color };
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

export function buildCardsLabelsController(service: CardsLabelsService) {
  const associate = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const { boardId, listId, cardId } = routeParams(req);
    const parsed = associateLabelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const label = await service.associate(userId, boardId, listId, cardId, parsed.data.labelId);
    res.status(201).json(serializeLabel(label));
  });

  const dissociate = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const { boardId, listId, cardId } = routeParams(req);
    const labelId = req.params["labelId"] as string;

    await service.dissociate(userId, boardId, listId, cardId, labelId);
    res.status(204).send();
  });

  return { associate, dissociate };
}
