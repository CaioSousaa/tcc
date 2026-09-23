import { NextFunction, Request, RequestHandler, Response } from "express";
import { ValidationError } from "../../shared/errors";
import { UnauthenticatedError } from "../auth/auth.errors";
import { ListsService } from "./lists.service";
import { createListSchema, formatZodError, updateListSchema } from "./lists.schemas";
import { List } from "./entities/list.entity";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
}

function serializeList(list: List) {
  return {
    id: list.id,
    name: list.name,
    boardId: list.boardId,
    position: list.position,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };
}

function requireOwnerId(req: Request): string {
  if (!req.user) {
    throw new UnauthenticatedError();
  }
  return req.user.id;
}

export function buildListsController(service: ListsService) {
  const create = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const boardId = req.params["boardId"] as string;
    const parsed = createListSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const list = await service.create(ownerId, boardId, parsed.data);
    res.status(201).json(serializeList(list));
  });

  const list = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const boardId = req.params["boardId"] as string;
    const lists = await service.list(ownerId, boardId);
    res.status(200).json({ lists: lists.map(serializeList) });
  });

  const update = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const boardId = req.params["boardId"] as string;
    const listId = req.params["listId"] as string;
    const parsed = updateListSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const updated = await service.update(ownerId, boardId, listId, parsed.data);
    res.status(200).json(serializeList(updated));
  });

  const remove = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const boardId = req.params["boardId"] as string;
    const listId = req.params["listId"] as string;
    await service.remove(ownerId, boardId, listId);
    res.status(204).send();
  });

  return { create, list, update, remove };
}
