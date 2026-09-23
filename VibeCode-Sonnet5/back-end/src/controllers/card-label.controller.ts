import { Request, Response } from "express";
import { AppDataSource } from "../utils/data-source";
import { findAccessibleCard } from "../utils/ownership";
import { CardLabel } from "../entities/CardLabel";
import { Label } from "../entities/Label";

export async function attachLabel(req: Request, res: Response): Promise<void> {
  const { labelId } = req.body as { labelId?: string };

  if (!labelId) {
    res.status(400).json({ error: "labelId é obrigatório." });
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

  const label = await AppDataSource.getRepository(Label).findOne({
    where: { id: labelId, boardId: card.boardId },
  });
  if (!label) {
    res.status(400).json({ error: "Etiqueta inválida." });
    return;
  }

  const cardLabelRepository = AppDataSource.getRepository(CardLabel);
  const existing = await cardLabelRepository.findOne({
    where: { cardId: card.id, labelId: label.id },
  });
  if (existing) {
    res.status(200).json({ ok: true });
    return;
  }

  const cardLabel = cardLabelRepository.create({
    cardId: card.id,
    labelId: label.id,
  });
  await cardLabelRepository.save(cardLabel);

  res.status(201).json({ ok: true });
}

export async function detachLabel(req: Request, res: Response): Promise<void> {
  const card = await findAccessibleCard(
    req.params.boardId as string,
    req.params.cardId as string,
    req.userId as string,
  );
  if (!card) {
    res.status(404).json({ error: "Card não encontrado." });
    return;
  }

  await AppDataSource.getRepository(CardLabel).delete({
    cardId: card.id,
    labelId: req.params.labelId as string,
  });

  res.status(204).send();
}
