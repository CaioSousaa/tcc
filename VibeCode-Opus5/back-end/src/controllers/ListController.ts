import type { NextFunction, Request, Response } from "express";
import { boardIdSchema } from "../schemas/board.schema";
import {
  createListSchema,
  deleteListSchema,
  listIdSchema,
  reorderListsSchema,
  updateListSchema,
} from "../schemas/list.schema";
import { listService } from "../services/ListService";
import { validate } from "../utils/validation";

function boardIdFrom(req: Request): string {
  return validate(boardIdSchema, req.params["boardId"]);
}

export class ListController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const lists = await listService.list(req.userId!, boardIdFrom(req));

      res.status(200).json({ lists });
    } catch (error) {
      next(error);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(createListSchema, req.body);
      const list = await listService.create(
        req.userId!,
        boardIdFrom(req),
        input,
      );

      res.status(201).json({ list });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const listId = validate(listIdSchema, req.params["listId"]);
      const input = validate(updateListSchema, req.body);
      const list = await listService.update(
        req.userId!,
        boardIdFrom(req),
        listId,
        input,
      );

      res.status(200).json({ list });
    } catch (error) {
      next(error);
    }
  }

  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(reorderListsSchema, req.body);
      const lists = await listService.reorder(
        req.userId!,
        boardIdFrom(req),
        input,
      );

      res.status(200).json({ lists });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const listId = validate(listIdSchema, req.params["listId"]);
      const input = validate(deleteListSchema, req.body);
      await listService.remove(req.userId!, boardIdFrom(req), listId, input);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const listController = new ListController();
