import type { NextFunction, Request, Response } from "express";
import { boardIdSchema } from "../schemas/board.schema";
import {
  cardLabelIdSchema,
  createCardLabelSchema,
} from "../schemas/card-label.schema";
import { cardLabelService } from "../services/CardLabelService";
import { validate } from "../utils/validation";

function boardIdFrom(req: Request): string {
  return validate(boardIdSchema, req.params["boardId"]);
}

export class CardLabelController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const cardLabels = await cardLabelService.list(
        req.userId!,
        boardIdFrom(req),
      );

      res.status(200).json({ cardLabels });
    } catch (error) {
      next(error);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(createCardLabelSchema, req.body);
      const cardLabel = await cardLabelService.create(
        req.userId!,
        boardIdFrom(req),
        input,
      );

      res.status(201).json({ cardLabel });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const cardLabelId = validate(
        cardLabelIdSchema,
        req.params["cardLabelId"],
      );
      await cardLabelService.remove(
        req.userId!,
        boardIdFrom(req),
        cardLabelId,
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const cardLabelController = new CardLabelController();
