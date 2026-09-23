import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { CreateCardInput, UpdateCardInput } from "../schemas/card.schemas";
import type { CardService } from "../services/CardService";

function currentUserId(req: Request): string {
  if (!req.user) throw new AppError("UNAUTHENTICATED");
  return req.user.id;
}

function param(req: Request, name: "boardId" | "listId" | "cardId"): string {
  return String(req.params[name]);
}

export class CardController {
  constructor(private readonly cardService: CardService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.cardService.create(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "listId"),
      req.body as CreateCardInput,
    );
    res.status(201).json(result);
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const card = await this.cardService.get(currentUserId(req), param(req, "boardId"), param(req, "cardId"));
    res.status(200).json({ card });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const result = await this.cardService.update(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      req.body as UpdateCardInput,
    );
    res.status(200).json(result);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const result = await this.cardService.delete(currentUserId(req), param(req, "boardId"), param(req, "cardId"));
    res.status(200).json(result);
  };
}
