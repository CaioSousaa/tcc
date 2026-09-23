import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { requireUuid } from "../../../shared/validation/validators";
import { requireLabelColor, requireLabelName } from "../labelValidation";
import {
  applyLabelToCard,
  createLabel,
  deleteLabel,
  listLabels,
  removeLabelFromCard,
  updateLabel,
} from "../services/labelService";

function authenticatedUserId(request: Request): string {
  const authenticated = request.user;

  if (!authenticated) {
    throw new AppError("Token de acesso não informado", 401);
  }

  return authenticated.id;
}

function boardIdFrom(request: Request): string {
  return requireUuid(request.params.boardId, "boardId");
}

export async function create(request: Request, response: Response): Promise<void> {
  const labels = await createLabel({
    boardId: boardIdFrom(request),
    actorId: authenticatedUserId(request),
    name: requireLabelName(request.body?.name),
    color: requireLabelColor(request.body?.color),
  });

  response.status(201).json({ labels });
}

export async function index(request: Request, response: Response): Promise<void> {
  const labels = await listLabels(boardIdFrom(request), authenticatedUserId(request));

  response.status(200).json({ labels });
}

export async function update(request: Request, response: Response): Promise<void> {
  const labels = await updateLabel({
    boardId: boardIdFrom(request),
    actorId: authenticatedUserId(request),
    labelId: requireUuid(request.params.labelId, "labelId"),
    name: requireLabelName(request.body?.name),
    color: requireLabelColor(request.body?.color),
  });

  response.status(200).json({ labels });
}

export async function destroy(request: Request, response: Response): Promise<void> {
  const labels = await deleteLabel({
    boardId: boardIdFrom(request),
    actorId: authenticatedUserId(request),
    labelId: requireUuid(request.params.labelId, "labelId"),
  });

  response.status(200).json({ labels });
}

export async function apply(request: Request, response: Response): Promise<void> {
  const labels = await applyLabelToCard({
    boardId: boardIdFrom(request),
    userId: authenticatedUserId(request),
    cardId: requireUuid(request.params.cardId, "cardId"),
    labelId: requireUuid(request.body?.labelId, "labelId"),
  });

  response.status(201).json({ labels });
}

export async function unapply(request: Request, response: Response): Promise<void> {
  const labels = await removeLabelFromCard({
    boardId: boardIdFrom(request),
    userId: authenticatedUserId(request),
    cardId: requireUuid(request.params.cardId, "cardId"),
    labelId: requireUuid(request.params.labelId, "labelId"),
  });

  response.status(200).json({ labels });
}
