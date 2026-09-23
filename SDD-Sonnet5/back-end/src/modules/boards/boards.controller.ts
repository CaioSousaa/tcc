import { NextFunction, Request, RequestHandler, Response } from "express";
import { ValidationError } from "../../shared/errors";
import { UnauthenticatedError } from "../auth/auth.errors";
import { BoardsService, BoardWithRole } from "./boards.service";
import { createBoardSchema, formatZodError, updateBoardSchema } from "./boards.schemas";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
}

function serializeBoard({ board, role }: BoardWithRole) {
  return {
    id: board.id,
    name: board.name,
    description: board.description,
    role,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

function requireOwnerId(req: Request): string {
  if (!req.user) {
    throw new UnauthenticatedError();
  }
  return req.user.id;
}

export function buildBoardsController(service: BoardsService) {
  const create = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const parsed = createBoardSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const result = await service.create(ownerId, parsed.data);
    res.status(201).json(serializeBoard(result));
  });

  const list = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const results = await service.list(ownerId);
    res.status(200).json({ boards: results.map(serializeBoard) });
  });

  const getById = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const result = await service.getById(ownerId, req.params["id"] as string);
    res.status(200).json(serializeBoard(result));
  });

  const update = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const parsed = updateBoardSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const result = await service.update(ownerId, req.params["id"] as string, parsed.data);
    res.status(200).json(serializeBoard(result));
  });

  const remove = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    await service.remove(ownerId, req.params["id"] as string);
    res.status(204).send();
  });

  return { create, list, getById, update, remove };
}
