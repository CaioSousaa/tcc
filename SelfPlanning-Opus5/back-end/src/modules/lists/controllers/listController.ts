import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { requireUuid } from "../../../shared/validation/validators";
import { optionalCardStrategy, requireListName, requirePosition } from "../listValidation";
import {
  createList,
  deleteList,
  listLists,
  moveList,
  renameList,
} from "../services/listService";

function authenticatedUserId(request: Request): string {
  const authenticated = request.user;

  if (!authenticated) {
    throw new AppError("Token de acesso não informado", 401);
  }

  return authenticated.id;
}

function boardIdFrom(request: Request): string {
  return requireUuid(request.params.boardId, "boardId");
}

export async function create(request: Request, response: Response): Promise<void> {
  const list = await createList({
    boardId: boardIdFrom(request),
    userId: authenticatedUserId(request),
    name: requireListName(request.body?.name),
  });

  response.status(201).json({ list });
}

export async function index(request: Request, response: Response): Promise<void> {
  const lists = await listLists(boardIdFrom(request), authenticatedUserId(request));

  response.status(200).json({ lists });
}

export async function rename(request: Request, response: Response): Promise<void> {
  const list = await renameList({
    boardId: boardIdFrom(request),
    userId: authenticatedUserId(request),
    listId: requireUuid(request.params.id, "id"),
    name: requireListName(request.body?.name),
  });

  response.status(200).json({ list });
}

export async function move(request: Request, response: Response): Promise<void> {
  const lists = await moveList({
    boardId: boardIdFrom(request),
    userId: authenticatedUserId(request),
    listId: requireUuid(request.params.id, "id"),
    position: requirePosition(request.body?.position),
  });

  response.status(200).json({ lists });
}

export async function destroy(request: Request, response: Response): Promise<void> {
  const targetListId = request.body?.targetListId;

  const result = await deleteList({
    listId: requireUuid(request.params.id, "id"),
    boardId: boardIdFrom(request),
    userId: authenticatedUserId(request),
    strategy: optionalCardStrategy(request.body?.strategy),
    targetListId:
      targetListId === undefined || targetListId === null || targetListId === ""
        ? null
        : requireUuid(targetListId, "targetListId"),
  });

  response.status(200).json(result);
}
