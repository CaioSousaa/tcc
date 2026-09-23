import type { NextFunction, Request, Response } from "express";
import { boardIdSchema } from "../schemas/board.schema";
import {
  cardIdSchema,
  createCardSchema,
  updateCardSchema,
} from "../schemas/card.schema";
import { cardService } from "../services/CardService";
import { validate } from "../utils/validation";

function boardIdFrom(req: Request): string {
  return validate(boardIdSchema, req.params["boardId"]);
}

export class CardController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const cards = await cardService.list(req.userId!, boardIdFrom(req));

      res.status(200).json({ cards });
    } catch (error) {
      next(error);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(createCardSchema, req.body);
      const card = await cardService.create(
        req.userId!,
        boardIdFrom(req),
        input,
      );

      res.status(201).json({ card });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const cardId = validate(cardIdSchema, req.params["cardId"]);
      const input = validate(updateCardSchema, req.body);
      const card = await cardService.update(
        req.userId!,
        boardIdFrom(req),
        cardId,
        input,
      );

      res.status(200).json({ card });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const cardId = validate(cardIdSchema, req.params["cardId"]);
      await cardService.remove(req.userId!, boardIdFrom(req), cardId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const cardController = new CardController();
