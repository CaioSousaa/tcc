import { NextFunction, Request, RequestHandler, Response } from "express";
import { ValidationError } from "../../shared/errors";
import { UnauthenticatedError } from "../auth/auth.errors";
import { LabelsService } from "./labels.service";
import { createLabelSchema, formatZodError, updateLabelSchema } from "./labels.schemas";
import { Label } from "./entities/label.entity";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
}

function serializeLabel(label: Label) {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
    boardId: label.boardId,
    createdAt: label.createdAt,
    updatedAt: label.updatedAt,
  };
}

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new UnauthenticatedError();
  }
  return req.user.id;
}

export function buildLabelsController(service: LabelsService) {
  const create = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const boardId = req.params["boardId"] as string;
    const parsed = createLabelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const label = await service.create(userId, boardId, parsed.data);
    res.status(201).json(serializeLabel(label));
  });

  const list = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const boardId = req.params["boardId"] as string;
    const labels = await service.list(userId, boardId);
    res.status(200).json({ labels: labels.map(serializeLabel) });
  });

  const update = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const boardId = req.params["boardId"] as string;
    const labelId = req.params["labelId"] as string;
    const parsed = updateLabelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const label = await service.update(userId, boardId, labelId, parsed.data);
    res.status(200).json(serializeLabel(label));
  });

  const remove = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const boardId = req.params["boardId"] as string;
    const labelId = req.params["labelId"] as string;
    await service.remove(userId, boardId, labelId);
    res.status(204).send();
  });

  return { create, list, update, remove };
}
