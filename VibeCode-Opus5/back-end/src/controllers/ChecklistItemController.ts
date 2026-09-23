import type { NextFunction, Request, Response } from "express";
import { boardIdSchema } from "../schemas/board.schema";
import {
  checklistItemIdSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from "../schemas/checklist-item.schema";
import { checklistItemService } from "../services/ChecklistItemService";
import { validate } from "../utils/validation";

function boardIdFrom(req: Request): string {
  return validate(boardIdSchema, req.params["boardId"]);
}

export class ChecklistItemController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await checklistItemService.list(
        req.userId!,
        boardIdFrom(req),
      );

      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(createChecklistItemSchema, req.body);
      const item = await checklistItemService.create(
        req.userId!,
        boardIdFrom(req),
        input,
      );

      res.status(201).json({ item });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const itemId = validate(checklistItemIdSchema, req.params["itemId"]);
      const input = validate(updateChecklistItemSchema, req.body);
      const item = await checklistItemService.update(
        req.userId!,
        boardIdFrom(req),
        itemId,
        input,
      );

      res.status(200).json({ item });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const itemId = validate(checklistItemIdSchema, req.params["itemId"]);
      await checklistItemService.remove(req.userId!, boardIdFrom(req), itemId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const checklistItemController = new ChecklistItemController();
