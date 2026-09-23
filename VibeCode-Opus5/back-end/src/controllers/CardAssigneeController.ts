import type { NextFunction, Request, Response } from "express";
import { boardIdSchema } from "../schemas/board.schema";
import {
  cardAssigneeIdSchema,
  createCardAssigneeSchema,
} from "../schemas/card-assignee.schema";
import { cardAssigneeService } from "../services/CardAssigneeService";
import { validate } from "../utils/validation";

function boardIdFrom(req: Request): string {
  return validate(boardIdSchema, req.params["boardId"]);
}

export class CardAssigneeController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const assignees = await cardAssigneeService.list(
        req.userId!,
        boardIdFrom(req),
      );

      res.status(200).json({ assignees });
    } catch (error) {
      next(error);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(createCardAssigneeSchema, req.body);
      const assignee = await cardAssigneeService.create(
        req.userId!,
        boardIdFrom(req),
        input,
      );

      res.status(201).json({ assignee });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const assigneeId = validate(
        cardAssigneeIdSchema,
        req.params["assigneeId"],
      );
      await cardAssigneeService.remove(
        req.userId!,
        boardIdFrom(req),
        assigneeId,
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const cardAssigneeController = new CardAssigneeController();
