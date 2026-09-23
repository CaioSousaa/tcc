import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { CreateChecklistItemInput, UpdateChecklistItemInput } from "../schemas/checklist.schemas";
import type { ChecklistService } from "../services/ChecklistService";

function currentUserId(req: Request): string {
  if (!req.user) throw new AppError("UNAUTHENTICATED");
  return req.user.id;
}

function param(req: Request, name: "boardId" | "cardId" | "itemId"): string {
  return String(req.params[name]);
}

export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  add = async (req: Request, res: Response): Promise<void> => {
    const result = await this.checklistService.add(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      req.body as CreateChecklistItemInput,
    );
    res.status(201).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const result = await this.checklistService.update(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      param(req, "itemId"),
      req.body as UpdateChecklistItemInput,
    );
    res.status(200).json(result);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const result = await this.checklistService.remove(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      param(req, "itemId"),
    );
    res.status(200).json(result);
  };
}
