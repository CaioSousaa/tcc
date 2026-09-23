import { Response } from "express";
import { BoardNotFoundError } from "../services/board.service";
import {
  DeleteListStrategy,
  InvalidDestinationListError,
  InvalidListOrderError,
  ListNotEmptyError,
  ListNotFoundError,
  createList,
  deleteList,
  listLists,
  renameList,
  reorderLists,
} from "../services/list.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

function handleKnownErrors(error: unknown, res: Response): boolean {
  if (error instanceof BoardNotFoundError) {
    res.status(404).json({ message: "Quadro não encontrado" });
    return true;
  }
  if (error instanceof ListNotFoundError) {
    res.status(404).json({ message: "Lista não encontrada" });
    return true;
  }
  return false;
}

export async function createListHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { name } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "Nome da lista é obrigatório" });
    return;
  }

  try {
    const list = await createList(
      req.userId as string,
      req.params.boardId as string,
      name.trim()
    );
    res.status(201).json(list);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function listListsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const lists = await listLists(req.userId as string, req.params.boardId as string);
    res.status(200).json(lists);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function renameListHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { name } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "Nome da lista é obrigatório" });
    return;
  }

  try {
    const list = await renameList(
      req.userId as string,
      req.params.boardId as string,
      req.params.listId as string,
      name.trim()
    );
    res.status(200).json(list);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function reorderListsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { orderedIds } = req.body ?? {};

  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
    res.status(400).json({ message: "orderedIds deve ser uma lista de ids" });
    return;
  }

  try {
    const lists = await reorderLists(
      req.userId as string,
      req.params.boardId as string,
      orderedIds
    );
    res.status(200).json(lists.sort((a, b) => a.position - b.position));
  } catch (error) {
    if (error instanceof InvalidListOrderError) {
      res.status(400).json({ message: "orderedIds não corresponde às listas do quadro" });
      return;
    }
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

const DELETE_STRATEGIES: DeleteListStrategy[] = ["move", "delete"];

export async function deleteListHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { strategy, destinationListId } = req.body ?? {};

  if (strategy !== undefined && !DELETE_STRATEGIES.includes(strategy)) {
    res.status(400).json({ message: "strategy deve ser 'move' ou 'delete'" });
    return;
  }
  if (destinationListId !== undefined && typeof destinationListId !== "string") {
    res.status(400).json({ message: "destinationListId inválido" });
    return;
  }

  try {
    await deleteList(req.userId as string, req.params.boardId as string, req.params.listId as string, {
      strategy,
      destinationListId,
    });
    res.status(204).send();
  } catch (error) {
    if (error instanceof ListNotEmptyError) {
      res.status(409).json({
        message:
          "A lista contém cards. Informe strategy 'move' (com destinationListId) ou 'delete'.",
      });
      return;
    }
    if (error instanceof InvalidDestinationListError) {
      res.status(400).json({ message: "destinationListId inválido para mover os cards" });
      return;
    }
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}
