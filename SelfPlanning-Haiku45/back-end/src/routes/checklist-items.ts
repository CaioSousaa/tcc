import { Router, Response } from "express";
import { AppDataSource } from "../database";
import { ChecklistItem } from "../entities/ChecklistItem";
import { Card } from "../entities/Card";
import { List } from "../entities/List";
import { Board } from "../entities/Board";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });
const checklistItemRepository = AppDataSource.getRepository(ChecklistItem);
const cardRepository = AppDataSource.getRepository(Card);
const listRepository = AppDataSource.getRepository(List);
const boardRepository = AppDataSource.getRepository(Board);

function validateTitle(titulo: unknown): boolean {
  if (typeof titulo !== "string") return false;
  return titulo.trim().length > 0 && titulo.length <= 200;
}

async function checkCardOwnership(
  boardId: string,
  listId: string,
  cardId: string,
  userId: string
): Promise<Card | null> {
  const board = await boardRepository.findOne({
    where: { id: boardId, usuarioId: userId },
  });
  if (!board) return null;

  const list = await listRepository.findOne({
    where: { id: listId, quadroId: boardId },
  });
  if (!list) return null;

  return cardRepository.findOne({
    where: { id: cardId, listaId: listId },
  });
}

router.post("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const boardId = Array.isArray(req.params.boardId)
      ? req.params.boardId[0]
      : req.params.boardId;
    const listId = Array.isArray(req.params.listId)
      ? req.params.listId[0]
      : req.params.listId;
    const cardId = Array.isArray(req.params.cardId)
      ? req.params.cardId[0]
      : req.params.cardId;

    if (!boardId || !listId || !cardId) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }

    const card = await checkCardOwnership(boardId, listId, cardId, req.userId);
    if (!card) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }

    const { titulo } = req.body;

    if (!validateTitle(titulo)) {
      res.status(400).json({ error: "Título inválido (1-200 caracteres)" });
      return;
    }

    const maxOrder = await checklistItemRepository
      .createQueryBuilder("item")
      .where("item.cardId = :cardId", { cardId })
      .select("MAX(item.ordem)", "max")
      .getRawOne();

    const newOrder = (maxOrder?.max || 0) + 1;

    const item = checklistItemRepository.create({
      cardId: cardId,
      titulo: titulo.trim(),
      ordem: newOrder,
      concluido: false,
    });

    await checklistItemRepository.save(item);

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar item de checklist" });
  }
});

router.get("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const boardId = Array.isArray(req.params.boardId)
      ? req.params.boardId[0]
      : req.params.boardId;
    const listId = Array.isArray(req.params.listId)
      ? req.params.listId[0]
      : req.params.listId;
    const cardId = Array.isArray(req.params.cardId)
      ? req.params.cardId[0]
      : req.params.cardId;

    if (!boardId || !listId || !cardId) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }

    const card = await checkCardOwnership(boardId, listId, cardId, req.userId);
    if (!card) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }

    const items = await checklistItemRepository.find({
      where: { cardId: cardId },
      order: { ordem: "ASC" },
    });

    const totalItems = items.length;
    const completedItems = items.filter((i) => i.concluido).length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    res.json({
      items,
      progress: {
        total: totalItems,
        completed: completedItems,
        percentage: progress,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar itens de checklist" });
  }
});

router.patch(
  "/:itemId",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const boardId = Array.isArray(req.params.boardId)
        ? req.params.boardId[0]
        : req.params.boardId;
      const listId = Array.isArray(req.params.listId)
        ? req.params.listId[0]
        : req.params.listId;
      const cardId = Array.isArray(req.params.cardId)
        ? req.params.cardId[0]
        : req.params.cardId;
      const itemId = Array.isArray(req.params.itemId)
        ? req.params.itemId[0]
        : req.params.itemId;

      if (!boardId || !listId || !cardId || !itemId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const card = await checkCardOwnership(boardId, listId, cardId, req.userId);
      if (!card) {
        res.status(404).json({ error: "Cartão não encontrado" });
        return;
      }

      const item = await checklistItemRepository.findOne({
        where: { id: itemId, cardId: cardId },
      });

      if (!item) {
        res.status(404).json({ error: "Item de checklist não encontrado" });
        return;
      }

      const { concluido, titulo } = req.body;

      if (concluido !== undefined) {
        item.concluido = Boolean(concluido);
      }

      if (titulo !== undefined) {
        if (!validateTitle(titulo)) {
          res.status(400).json({ error: "Título inválido (1-200 caracteres)" });
          return;
        }
        item.titulo = titulo.trim();
      }

      await checklistItemRepository.save(item);

      res.json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar item de checklist" });
    }
  }
);

router.delete(
  "/:itemId",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const boardId = Array.isArray(req.params.boardId)
        ? req.params.boardId[0]
        : req.params.boardId;
      const listId = Array.isArray(req.params.listId)
        ? req.params.listId[0]
        : req.params.listId;
      const cardId = Array.isArray(req.params.cardId)
        ? req.params.cardId[0]
        : req.params.cardId;
      const itemId = Array.isArray(req.params.itemId)
        ? req.params.itemId[0]
        : req.params.itemId;

      if (!boardId || !listId || !cardId || !itemId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const card = await checkCardOwnership(boardId, listId, cardId, req.userId);
      if (!card) {
        res.status(404).json({ error: "Cartão não encontrado" });
        return;
      }

      const item = await checklistItemRepository.findOne({
        where: { id: itemId, cardId: cardId },
      });

      if (!item) {
        res.status(404).json({ error: "Item de checklist não encontrado" });
        return;
      }

      const ordemDeletada = item.ordem;

      await checklistItemRepository.remove(item);

      await AppDataSource.createQueryBuilder()
        .update(ChecklistItem)
        .set({ ordem: () => "ordem - 1" })
        .where("cardId = :cardId", { cardId })
        .andWhere("ordem > :ordemDeletada", { ordemDeletada })
        .execute();

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao deletar item de checklist" });
    }
  }
);

export default router;
