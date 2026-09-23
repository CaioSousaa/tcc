import { AppDataSource } from "../config/data-source";
import { Card } from "../entities/Card";
import { getBoard } from "./board.service";
import { getList } from "./list.service";

const cardRepository = () => AppDataSource.getRepository(Card);

export class CardNotFoundError extends Error {}

async function ensureBoardOwnership(ownerId: string, boardId: string): Promise<void> {
  await getBoard(ownerId, boardId);
}

async function findCardOrThrow(boardId: string, cardId: string): Promise<Card> {
  const card = await cardRepository().findOne({
    where: { id: cardId, list: { boardId } },
  });
  if (!card) {
    throw new CardNotFoundError();
  }
  return card;
}

async function resequence(listId: string): Promise<void> {
  const siblings = await cardRepository().find({
    where: { listId },
    order: { position: "ASC" },
  });
  siblings.forEach((card, index) => {
    card.position = index;
  });
  if (siblings.length) {
    await cardRepository().save(siblings);
  }
}

export async function createCard(
  ownerId: string,
  boardId: string,
  listId: string,
  title: string,
  description: string | null
): Promise<Card> {
  await getList(ownerId, boardId, listId);

  const count = await cardRepository().count({ where: { listId } });
  const card = cardRepository().create({ listId, title, description, position: count });
  return cardRepository().save(card);
}

export type CardSortBy = "position" | "dueDate";

export async function listCards(
  ownerId: string,
  boardId: string,
  listId: string,
  sortBy: CardSortBy = "position"
): Promise<Card[]> {
  await getList(ownerId, boardId, listId);

  return cardRepository().find({
    where: { listId },
    order:
      sortBy === "dueDate"
        ? { dueDate: "ASC", position: "ASC" }
        : { position: "ASC" },
  });
}

export async function getCardInBoard(boardId: string, cardId: string): Promise<Card> {
  return findCardOrThrow(boardId, cardId);
}

export async function getCard(
  ownerId: string,
  boardId: string,
  cardId: string
): Promise<Card> {
  await ensureBoardOwnership(ownerId, boardId);
  return findCardOrThrow(boardId, cardId);
}

export async function updateCard(
  ownerId: string,
  boardId: string,
  cardId: string,
  changes: { title?: string; description?: string | null; dueDate?: Date | null }
): Promise<Card> {
  await ensureBoardOwnership(ownerId, boardId);
  const card = await findCardOrThrow(boardId, cardId);

  if (changes.title !== undefined) card.title = changes.title;
  if (changes.description !== undefined) card.description = changes.description;
  if (changes.dueDate !== undefined) card.dueDate = changes.dueDate;

  return cardRepository().save(card);
}

export async function moveCard(
  ownerId: string,
  boardId: string,
  cardId: string,
  destinationListId: string,
  position: number
): Promise<Card> {
  await ensureBoardOwnership(ownerId, boardId);
  const card = await findCardOrThrow(boardId, cardId);
  await getList(ownerId, boardId, destinationListId);

  const sourceListId = card.listId;

  const destSiblings = await cardRepository().find({
    where: { listId: destinationListId },
    order: { position: "ASC" },
  });
  const others = destSiblings.filter((sibling) => sibling.id !== cardId);
  const clampedPosition = Math.max(0, Math.min(Math.trunc(position), others.length));

  card.listId = destinationListId;
  others.splice(clampedPosition, 0, card);
  others.forEach((sibling, index) => {
    sibling.position = index;
  });
  await cardRepository().save(others);

  if (sourceListId !== destinationListId) {
    await resequence(sourceListId);
  }

  return card;
}

export async function deleteCard(
  ownerId: string,
  boardId: string,
  cardId: string
): Promise<void> {
  await ensureBoardOwnership(ownerId, boardId);
  const card = await findCardOrThrow(boardId, cardId);
  const { listId } = card;
  await cardRepository().remove(card);
  await resequence(listId);
}
