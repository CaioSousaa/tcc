import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { optionalBoolean, requireUuid } from "../../../shared/validation/validators";
import { requireBoardColor, requireBoardName } from "../boardValidation";
import {
  createBoard,
  deleteBoard,
  listBoards,
  showBoard,
  updateBoard,
} from "../services/boardService";

function authenticatedUserId(request: Request): string {
  const authenticated = request.user;

  if (!authenticated) {
    throw new AppError("Token de acesso não informado", 401);
  }

  return authenticated.id;
}

export async function create(request: Request, response: Response): Promise<void> {
  const board = await createBoard({
    ownerId: authenticatedUserId(request),
    name: requireBoardName(request.body?.name),
    color: requireBoardColor(request.body?.color),
    blockListDeletionWithCards: optionalBoolean(
      request.body?.blockListDeletionWithCards,
      "blockListDeletionWithCards",
      false
    ),
  });

  response.status(201).json({ board });
}

export async function index(request: Request, response: Response): Promise<void> {
  const boards = await listBoards(authenticatedUserId(request));

  response.status(200).json({ boards });
}

export async function show(request: Request, response: Response): Promise<void> {
  const board = await showBoard(
    requireUuid(request.params.id, "id"),
    authenticatedUserId(request)
  );

  response.status(200).json({ board });
}

export async function update(request: Request, response: Response): Promise<void> {
  const board = await updateBoard({
    boardId: requireUuid(request.params.id, "id"),
    actorId: authenticatedUserId(request),
    name: requireBoardName(request.body?.name),
    color: requireBoardColor(request.body?.color),
    blockListDeletionWithCards: optionalBoolean(
      request.body?.blockListDeletionWithCards,
      "blockListDeletionWithCards",
      false
    ),
  });

  response.status(200).json({ board });
}

export async function destroy(request: Request, response: Response): Promise<void> {
  await deleteBoard(requireUuid(request.params.id, "id"), authenticatedUserId(request));

  response.status(204).send();
}
