import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { ListDeletionRequest } from "../domain/listDeletion";
import type { CreateListInput, UpdateListInput } from "../schemas/list.schemas";
import type { ListService } from "../services/ListService";

function currentUserId(req: Request): string {
  if (!req.user) throw new AppError("UNAUTHENTICATED");
  return req.user.id;
}

function param(req: Request, name: "boardId" | "listId"): string {
  return String(req.params[name]);
}

export class ListController {
  constructor(private readonly listService: ListService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.listService.create(currentUserId(req), param(req, "boardId"), req.body as CreateListInput);
    res.status(201).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const result = await this.listService.update(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "listId"),
      req.body as UpdateListInput,
    );
    res.status(200).json(result);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    // Validated by validateQuery (RF05 plan 4.1).
    const request = res.locals.query as ListDeletionRequest;
    const result = await this.listService.delete(currentUserId(req), param(req, "boardId"), param(req, "listId"), request);
    res.status(200).json(result);
  };
}
