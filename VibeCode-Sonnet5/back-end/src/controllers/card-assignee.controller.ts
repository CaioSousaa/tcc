import { Request, Response } from "express";
import { AppDataSource } from "../utils/data-source";
import { findAccessibleCard, getBoardRole } from "../utils/ownership";
import { CardAssignee } from "../entities/CardAssignee";
import { User } from "../entities/User";

export async function listAssignees(req: Request, res: Response): Promise<void> {
  const card = await findAccessibleCard(
    req.params.boardId as string,
    req.params.cardId as string,
    req.userId as string,
  );
  if (!card) {
    res.status(404).json({ error: "Card não encontrado." });
    return;
  }

  const assignees = await AppDataSource.getRepository(CardAssignee).find({
    where: { cardId: card.id },
    relations: { user: true },
    order: { createdAt: "ASC" },
  });

  res.status(200).json({
    assignees: assignees.map((assignee) => ({
      userId: assignee.user.id,
      name: assignee.user.name,
      email: assignee.user.email,
    })),
  });
}

export async function assignCard(req: Request, res: Response): Promise<void> {
  const { userId } = req.body as { userId?: string };

  if (!userId) {
    res.status(400).json({ error: "userId é obrigatório." });
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

  const targetRole = await getBoardRole(card.boardId, userId);
  if (!targetRole) {
    res.status(400).json({ error: "Usuário não é membro deste quadro." });
    return;
  }

  const assigneeRepository = AppDataSource.getRepository(CardAssignee);
  const existing = await assigneeRepository.findOne({
    where: { cardId: card.id, userId },
  });
  if (existing) {
    res.status(200).json({ ok: true });
    return;
  }

  const assignee = assigneeRepository.create({ cardId: card.id, userId });
  await assigneeRepository.save(assignee);

  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
  });

  res.status(201).json({
    assignee: { userId, name: user?.name, email: user?.email },
  });
}

export async function unassignCard(req: Request, res: Response): Promise<void> {
  const card = await findAccessibleCard(
    req.params.boardId as string,
    req.params.cardId as string,
    req.userId as string,
  );
  if (!card) {
    res.status(404).json({ error: "Card não encontrado." });
    return;
  }

  const assigneeRepository = AppDataSource.getRepository(CardAssignee);
  await assigneeRepository.delete({
    cardId: card.id,
    userId: req.params.userId as string,
  });

  res.status(204).send();
}
