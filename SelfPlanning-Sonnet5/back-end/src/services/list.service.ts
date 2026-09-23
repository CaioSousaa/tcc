import { AppDataSource } from "../config/data-source";
import { List } from "../entities/List";
import { Card } from "../entities/Card";
import { getBoard } from "./board.service";

const listRepository = () => AppDataSource.getRepository(List);
const cardRepository = () => AppDataSource.getRepository(Card);

export class ListNotFoundError extends Error {}
export class InvalidListOrderError extends Error {}
export class ListNotEmptyError extends Error {}
export class InvalidDestinationListError extends Error {}

export type DeleteListStrategy = "move" | "delete";

export interface DeleteListOptions {
  strategy?: DeleteListStrategy;
  destinationListId?: string;
}

async function ensureBoardOwnership(ownerId: string, boardId: string): Promise<void> {
  await getBoard(ownerId, boardId);
}

export async function createList(
  ownerId: string,
  boardId: string,
  name: string
): Promise<List> {
  await ensureBoardOwnership(ownerId, boardId);

  const count = await listRepository().count({ where: { boardId } });
  const list = listRepository().create({ boardId, name, position: count });
  return listRepository().save(list);
}

export async function listLists(ownerId: string, boardId: string): Promise<List[]> {
  await ensureBoardOwnership(ownerId, boardId);

  return listRepository().find({
    where: { boardId },
    order: { position: "ASC" },
  });
}

async function findListOrThrow(boardId: string, listId: string): Promise<List> {
  const list = await listRepository().findOne({ where: { id: listId, boardId } });
  if (!list) {
    throw new ListNotFoundError();
  }
  return list;
}

export async function getList(
  ownerId: string,
  boardId: string,
  listId: string
): Promise<List> {
  await ensureBoardOwnership(ownerId, boardId);
  return findListOrThrow(boardId, listId);
}

export async function renameList(
  ownerId: string,
  boardId: string,
  listId: string,
  name: string
): Promise<List> {
  await ensureBoardOwnership(ownerId, boardId);
  const list = await findListOrThrow(boardId, listId);
  list.name = name;
  return listRepository().save(list);
}

export async function reorderLists(
  ownerId: string,
  boardId: string,
  orderedIds: string[]
): Promise<List[]> {
  await ensureBoardOwnership(ownerId, boardId);

  const lists = await listRepository().find({ where: { boardId } });

  const currentIds = new Set(lists.map((list) => list.id));
  const incomingIds = new Set(orderedIds);
  const sameSet =
    currentIds.size === incomingIds.size &&
    [...currentIds].every((id) => incomingIds.has(id));

  if (!sameSet) {
    throw new InvalidListOrderError();
  }

  const listsById = new Map(lists.map((list) => [list.id, list]));
  const updated = orderedIds.map((id, index) => {
    const list = listsById.get(id) as List;
    list.position = index;
    return list;
  });

  return listRepository().save(updated);
}

export async function deleteList(
  ownerId: string,
  boardId: string,
  listId: string,
  options?: DeleteListOptions
): Promise<void> {
  await ensureBoardOwnership(ownerId, boardId);
  const list = await findListOrThrow(boardId, listId);

  const cardCount = await cardRepository().count({ where: { listId } });

  if (cardCount === 0) {
    await listRepository().remove(list);
    return;
  }

  if (!options?.strategy) {
    throw new ListNotEmptyError();
  }

  if (options.strategy === "delete") {
    await listRepository().remove(list);
    return;
  }

  const { destinationListId } = options;
  if (!destinationListId || destinationListId === listId) {
    throw new InvalidDestinationListError();
  }

  await findListOrThrow(boardId, destinationListId);

  const cardsToMove = await cardRepository().find({
    where: { listId },
    order: { position: "ASC" },
  });
  const destinationCount = await cardRepository().count({
    where: { listId: destinationListId },
  });

  cardsToMove.forEach((card, index) => {
    card.listId = destinationListId;
    card.position = destinationCount + index;
  });
  await cardRepository().save(cardsToMove);

  await listRepository().remove(list);
}
