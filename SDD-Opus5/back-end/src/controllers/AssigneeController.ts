import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { AssigneeService } from "../services/AssigneeService";

function currentUserId(req: Request): string {
  if (!req.user) throw new AppError("UNAUTHENTICATED");
  return req.user.id;
}

function param(req: Request, name: "boardId" | "cardId" | "userId"): string {
  return String(req.params[name]);
}

export class AssigneeController {
  constructor(private readonly assigneeService: AssigneeService) {}

  assign = async (req: Request, res: Response): Promise<void> => {
    const result = await this.assigneeService.assign(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      param(req, "userId"),
    );
    res.status(200).json(result);
  };

  unassign = async (req: Request, res: Response): Promise<void> => {
    const result = await this.assigneeService.unassign(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      param(req, "userId"),
    );
    res.status(200).json(result);
  };
}
