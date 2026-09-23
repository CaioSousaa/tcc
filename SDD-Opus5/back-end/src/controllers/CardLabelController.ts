import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { CardLabelService } from "../services/CardLabelService";

function currentUserId(req: Request): string {
  if (!req.user) throw new AppError("UNAUTHENTICATED");
  return req.user.id;
}

function param(req: Request, name: "boardId" | "cardId" | "labelId"): string {
  return String(req.params[name]);
}

export class CardLabelController {
  constructor(private readonly cardLabelService: CardLabelService) {}

  apply = async (req: Request, res: Response): Promise<void> => {
    const result = await this.cardLabelService.apply(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      param(req, "labelId"),
    );
    res.status(200).json(result);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const result = await this.cardLabelService.remove(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      param(req, "labelId"),
    );
    res.status(200).json(result);
  };
}
