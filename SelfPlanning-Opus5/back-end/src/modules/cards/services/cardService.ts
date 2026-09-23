import { AppError } from "../../../shared/errors/AppError";
import { requireBoardAccess } from "../../boards/services/boardService";
import { findOwnedList } from "../../lists/services/listService";
import { CardView, CardsByList, toCardView } from "../cardView";
import { CardQueryOptions, countChecklistByCards, groupCardsByBoard } from "./cardGrouping";
import { assigneesOfCard } from "../../members/services/assigneeGrouping";
import { labelsOfCard } from "../../labels/services/labelGrouping";
import { countCommentsOfCard } from "../../comments/services/commentGrouping";
import { Card } from "../entities/Card";
import { cardRepository } from "../repositories/cardRepository";

export interface CreateCardRequest {
  boardId: string;
  userId: string;
  listId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
}

export interface UpdateCardRequest {
  boardId: string;
  userId: string;
  cardId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
}

export interface MoveCardRequest {
  boardId: string;
  userId: string;
  cardId: string;
  listId: string;
  position: number;
}

async function findCardsOfList(listId: string): Promise<Card[]> {
  return cardRepository().find({ where: { listId }, order: { position: "ASC" } });
}

/** Regrava as posições em sequência para que nunca haja buraco na numeração. */
async function persistOrder(cards: Card[], listId: string): Promise<void> {
  const reordered = cards.map((card, index) => {
    card.position = index;
    card.listId = listId;

    return card;
  });

  await cardRepository().save(reordered);
}

export async function findOwnedCard(cardId: string, boardId: string, userId: string): Promise<Card> {
  await requireBoardAccess(boardId, userId);

  const card = await cardRepository().findOne({
    where: { id: cardId },
    relations: { list: true },
  });

  if (!card || card.list.boardId !== boardId) {
    throw new AppError("Card não encontrado", 404);
  }

  return card;
}

export async function createCard(data: CreateCardRequest): Promise<CardView> {
  await findOwnedList(data.listId, data.boardId, data.userId);

  const repository = cardRepository();
  const total = await repository.count({ where: { listId: data.listId } });

  const card = repository.create({
    title: data.title,
    description: data.description,
    dueDate: data.dueDate,
    position: total,
    listId: data.listId,
  });

  await repository.save(card);

  return toCardView(card);
}

export async function listCards(
  boardId: string,
  userId: string,
  options: CardQueryOptions = {}
): Promise<CardsByList> {
  await requireBoardAccess(boardId, userId);

  return groupCardsByBoard(boardId, undefined, options);
}

export async function updateCard(data: UpdateCardRequest): Promise<CardView> {
  const card = await findOwnedCard(data.cardId, data.boardId, data.userId);

  card.title = data.title;
  card.description = data.description;
  card.dueDate = data.dueDate;

  await cardRepository().save(card);

  const progress = await countChecklistByCards([card.id]);

  return toCardView(
    card,
    progress.get(card.id),
    await assigneesOfCard(card.id),
    await labelsOfCard(card.id),
    await countCommentsOfCard(card.id)
  );
}

export async function moveCard(data: MoveCardRequest): Promise<CardsByList> {
  const card = await findOwnedCard(data.cardId, data.boardId, data.userId);

  await findOwnedList(data.listId, data.boardId, data.userId);

  const originListId = card.listId;

  const originCards = (await findCardsOfList(originListId)).filter(
    (item) => item.id !== card.id
  );

  if (originListId === data.listId) {
    const targetIndex = Math.min(data.position, originCards.length);

    originCards.splice(targetIndex, 0, card);

    await persistOrder(originCards, originListId);
  } else {
    const targetCards = await findCardsOfList(data.listId);
    const targetIndex = Math.min(data.position, targetCards.length);

    targetCards.splice(targetIndex, 0, card);

    await persistOrder(originCards, originListId);
    await persistOrder(targetCards, data.listId);
  }

  return groupCardsByBoard(data.boardId);
}

export async function deleteCard(
  cardId: string,
  boardId: string,
  userId: string
): Promise<CardsByList> {
  const card = await findOwnedCard(cardId, boardId, userId);
  const listId = card.listId;

  await cardRepository().remove(card);

  await persistOrder(await findCardsOfList(listId), listId);

  return groupCardsByBoard(boardId);
}
