import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { LabelInput } from "../schemas/label.schemas";
import type { LabelService } from "../services/LabelService";

function currentUserId(req: Request): string {
  if (!req.user) throw new AppError("UNAUTHENTICATED");
  return req.user.id;
}

function param(req: Request, name: "boardId" | "labelId"): string {
  return String(req.params[name]);
}

export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const labels = await this.labelService.list(currentUserId(req), param(req, "boardId"));
    res.status(200).json({ labels });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.labelService.create(currentUserId(req), param(req, "boardId"), req.body as LabelInput);
    res.status(201).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const result = await this.labelService.update(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "labelId"),
      req.body as LabelInput,
    );
    res.status(200).json(result);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const result = await this.labelService.delete(currentUserId(req), param(req, "boardId"), param(req, "labelId"));
    res.status(200).json(result);
  };
}
