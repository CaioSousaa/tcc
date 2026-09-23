import { Request, Response } from "express";
import { AppDataSource } from "../utils/data-source";
import { findAccessibleCard } from "../utils/ownership";
import { ChecklistItem } from "../entities/ChecklistItem";

const MAX_TEXT_LENGTH = 240;

function toItemResponse(item: ChecklistItem) {
  return {
    id: item.id,
    text: item.text,
    completed: item.completed,
    position: item.position,
    cardId: item.cardId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function listChecklistItems(
  req: Request,
  res: Response,
): Promise<void> {
  const card = await findAccessibleCard(
    req.params.boardId as string,
    req.params.cardId as string,
    req.userId as string,
  );
  if (!card) {
    res.status(404).json({ error: "Card não encontrado." });
    return;
  }

  const itemRepository = AppDataSource.getRepository(ChecklistItem);
  const items = await itemRepository.find({
    where: { cardId: card.id },
    order: { position: "ASC" },
  });

  res.status(200).json({ items: items.map(toItemResponse) });
}

export async function createChecklistItem(
  req: Request,
  res: Response,
): Promise<void> {
  const { text } = req.body as { text?: string };

  if (!text?.trim()) {
    res.status(400).json({ error: "Texto do item é obrigatório." });
    return;
  }

  if (text.trim().length > MAX_TEXT_LENGTH) {
    res
      .status(400)
      .json({ error: `Texto do item deve ter no máximo ${MAX_TEXT_LENGTH} caracteres.` });
    return;
  }

  const card = await findAccessibleCard(
    req.params.boardId as string,
    req.params.cardId as string,
    req.userId as string,
  );
  if (!card) {
    res.status(404).json({ error: "Card não encontrado." });
    return;
  }

  const itemRepository = AppDataSource.getRepository(ChecklistItem);
  const { maxPosition } = (await itemRepository
    .createQueryBuilder("item")
    .select("MAX(item.position)", "maxPosition")
    .where("item.card_id = :cardId", { cardId: card.id })
    .getRawOne()) as { maxPosition: number | null };

  const item = itemRepository.create({
    text: text.trim(),
    completed: false,
    position: (maxPosition ?? -1) + 1,
    cardId: card.id,
  });
  await itemRepository.save(item);

  res.status(201).json({ item: toItemResponse(item) });
}

export async function updateChecklistItem(
  req: Request,
  res: Response,
): Promise<void> {
  const { text, completed } = req.body as {
    text?: string;
    completed?: boolean;
  };

  if (text !== undefined && !text.trim()) {
    res.status(400).json({ error: "Texto do item é obrigatório." });
    return;
  }

  if (text !== undefined && text.trim().length > MAX_TEXT_LENGTH) {
    res
      .status(400)
      .json({ error: `Texto do item deve ter no máximo ${MAX_TEXT_LENGTH} caracteres.` });
    return;
  }

  const card = await findAccessibleCard(
    req.params.boardId as string,
    req.params.cardId as string,
    req.userId as string,
  );
  if (!card) {
    res.status(404).json({ error: "Card não encontrado." });
    return;
  }

  const itemRepository = AppDataSource.getRepository(ChecklistItem);
  const item = await itemRepository.findOne({
    where: { id: req.params.id as string, cardId: card.id },
  });
  if (!item) {
    res.status(404).json({ error: "Item não encontrado." });
    return;
  }

  if (text !== undefined) item.text = text.trim();
  if (completed !== undefined) item.completed = completed;
  await itemRepository.save(item);

  res.status(200).json({ item: toItemResponse(item) });
}

export async function deleteChecklistItem(
  req: Request,
  res: Response,
): Promise<void> {
  const card = await findAccessibleCard(
    req.params.boardId as string,
    req.params.cardId as string,
    req.userId as string,
  );
  if (!card) {
    res.status(404).json({ error: "Card não encontrado." });
    return;
  }

  const itemRepository = AppDataSource.getRepository(ChecklistItem);
  const item = await itemRepository.findOne({
    where: { id: req.params.id as string, cardId: card.id },
  });
  if (!item) {
    res.status(404).json({ error: "Item não encontrado." });
    return;
  }

  await itemRepository.remove(item);

  const remaining = await itemRepository.find({
    where: { cardId: card.id },
    order: { position: "ASC" },
  });
  await Promise.all(
    remaining.map((current, index) => {
      if (current.position === index) return Promise.resolve();
      current.position = index;
      return itemRepository.save(current);
    }),
  );

  res.status(204).send();
}
