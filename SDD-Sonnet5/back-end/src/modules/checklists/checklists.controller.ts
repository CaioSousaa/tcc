import { NextFunction, Request, RequestHandler, Response } from "express";
import { ValidationError } from "../../shared/errors";
import { UnauthenticatedError } from "../auth/auth.errors";
import { ChecklistsService } from "./checklists.service";
import {
  createChecklistSchema,
  createItemSchema,
  formatZodError,
  updateItemSchema,
} from "./checklists.schemas";
import { ChecklistItem } from "./entities/checklist-item.entity";
import { ChecklistWithItems } from "./repositories/repository.types";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
}

function serializeItem(item: ChecklistItem) {
  return {
    id: item.id,
    text: item.text,
    completed: item.completed,
    checklistId: item.checklistId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function serializeChecklist(checklist: ChecklistWithItems) {
  return {
    id: checklist.id,
    name: checklist.name,
    cardId: checklist.cardId,
    items: checklist.items.map(serializeItem),
    createdAt: checklist.createdAt,
    updatedAt: checklist.updatedAt,
  };
}

function requireOwnerId(req: Request): string {
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
    checklistId: req.params["checklistId"] as string,
    itemId: req.params["itemId"] as string,
  };
}

export function buildChecklistsController(service: ChecklistsService) {
  const createChecklist = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const { boardId, listId, cardId } = routeParams(req);
    const parsed = createChecklistSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const checklist = await service.createChecklist(ownerId, boardId, listId, cardId, parsed.data);
    res.status(201).json(serializeChecklist({ ...checklist, items: [] }));
  });

  const listChecklists = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const { boardId, listId, cardId } = routeParams(req);
    const checklists = await service.listChecklists(ownerId, boardId, listId, cardId);
    res.status(200).json({ checklists: checklists.map(serializeChecklist) });
  });

  const deleteChecklist = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const { boardId, listId, cardId, checklistId } = routeParams(req);
    await service.deleteChecklist(ownerId, boardId, listId, cardId, checklistId);
    res.status(204).send();
  });

  const createItem = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const { boardId, listId, cardId, checklistId } = routeParams(req);
    const parsed = createItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const item = await service.createItem(ownerId, boardId, listId, cardId, checklistId, parsed.data);
    res.status(201).json(serializeItem(item));
  });

  const updateItem = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const { boardId, listId, cardId, checklistId, itemId } = routeParams(req);
    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const item = await service.updateItem(
      ownerId,
      boardId,
      listId,
      cardId,
      checklistId,
      itemId,
      parsed.data,
    );
    res.status(200).json(serializeItem(item));
  });

  const deleteItem = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const { boardId, listId, cardId, checklistId, itemId } = routeParams(req);
    await service.deleteItem(ownerId, boardId, listId, cardId, checklistId, itemId);
    res.status(204).send();
  });

  return { createChecklist, listChecklists, deleteChecklist, createItem, updateItem, deleteItem };
}
