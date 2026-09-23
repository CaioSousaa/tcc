import { Router, Response } from "express";
import { AppDataSource } from "../database";
import { List } from "../entities/List";
import { Board } from "../entities/Board";
import { Card } from "../entities/Card";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });
const listRepository = AppDataSource.getRepository(List);
const boardRepository = AppDataSource.getRepository(Board);
const cardRepository = AppDataSource.getRepository(Card);

function validateTitle(titulo: unknown): boolean {
  if (typeof titulo !== "string") return false;
  return titulo.trim().length > 0 && titulo.length <= 50;
}

async function checkBoardOwnership(
  boardId: string,
  userId: string
): Promise<Board | null> {
  return boardRepository.findOne({
    where: { id: boardId, usuarioId: userId },
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

    if (!boardId) {
      res.status(400).json({ error: "ID do quadro inválido" });
      return;
    }

    const board = await checkBoardOwnership(boardId, req.userId);
    if (!board) {
      res.status(404).json({ error: "Quadro não encontrado" });
      return;
    }

    const { titulo } = req.body;

    if (!validateTitle(titulo)) {
      res.status(400).json({ error: "Título inválido (1-50 caracteres)" });
      return;
    }

    const maxOrder = await listRepository
      .createQueryBuilder("list")
      .where("list.quadroId = :boardId", { boardId })
      .select("MAX(list.ordem)", "max")
      .getRawOne();

    const newOrder = (maxOrder?.max || 0) + 1;

    const list = listRepository.create({
      quadroId: boardId,
      titulo: titulo.trim(),
      ordem: newOrder,
    });

    await listRepository.save(list);

    res.status(201).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar lista" });
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

    if (!boardId) {
      res.status(400).json({ error: "ID do quadro inválido" });
      return;
    }

    const board = await checkBoardOwnership(boardId, req.userId);
    if (!board) {
      res.status(404).json({ error: "Quadro não encontrado" });
      return;
    }

    const lists = await listRepository.find({
      where: { quadroId: boardId },
      order: { ordem: "ASC" },
    });

    res.json(lists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar listas" });
  }
});

router.patch(
  "/:listId",
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

      if (!boardId || !listId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const board = await checkBoardOwnership(boardId, req.userId);
      if (!board) {
        res.status(404).json({ error: "Quadro não encontrado" });
        return;
      }

      const list = await listRepository.findOne({
        where: { id: listId, quadroId: boardId },
      });

      if (!list) {
        res.status(404).json({ error: "Lista não encontrada" });
        return;
      }

      const { titulo } = req.body;

      if (titulo !== undefined) {
        if (!validateTitle(titulo)) {
          res.status(400).json({ error: "Título inválido (1-50 caracteres)" });
          return;
        }
        list.titulo = titulo.trim();
      }

      await listRepository.save(list);

      res.json(list);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar lista" });
    }
  }
);

router.patch(
  "/:listId/reorder",
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

      if (!boardId || !listId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const board = await checkBoardOwnership(boardId, req.userId);
      if (!board) {
        res.status(404).json({ error: "Quadro não encontrado" });
        return;
      }

      const list = await listRepository.findOne({
        where: { id: listId, quadroId: boardId },
      });

      if (!list) {
        res.status(404).json({ error: "Lista não encontrada" });
        return;
      }

      const { novaOrdem } = req.body;

      if (typeof novaOrdem !== "number" || novaOrdem < 1) {
        res.status(400).json({ error: "Ordem inválida" });
        return;
      }

      const ordemAtual = list.ordem;

      if (novaOrdem > ordemAtual) {
        await AppDataSource.createQueryBuilder()
          .update(List)
          .set({ ordem: () => "ordem - 1" })
          .where("quadroId = :boardId", { boardId })
          .andWhere("ordem > :ordemAtual", { ordemAtual })
          .andWhere("ordem <= :novaOrdem", { novaOrdem })
          .execute();
      } else if (novaOrdem < ordemAtual) {
        await AppDataSource.createQueryBuilder()
          .update(List)
          .set({ ordem: () => "ordem + 1" })
          .where("quadroId = :boardId", { boardId })
          .andWhere("ordem < :ordemAtual", { ordemAtual })
          .andWhere("ordem >= :novaOrdem", { novaOrdem })
          .execute();
      }

      list.ordem = novaOrdem;
      await listRepository.save(list);

      res.json(list);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao reordenar lista" });
    }
  }
);

router.delete(
  "/:listId",
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

      if (!boardId || !listId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const board = await checkBoardOwnership(boardId, req.userId);
      if (!board) {
        res.status(404).json({ error: "Quadro não encontrado" });
        return;
      }

      const list = await listRepository.findOne({
        where: { id: listId, quadroId: boardId },
      });

      if (!list) {
        res.status(404).json({ error: "Lista não encontrada" });
        return;
      }

      // Count cards before deletion
      const cardsCount = await cardRepository.count({
        where: { listaId: listId },
      });

      const ordemDeletada = list.ordem;

      await listRepository.remove(list);

      await AppDataSource.createQueryBuilder()
        .update(List)
        .set({ ordem: () => "ordem - 1" })
        .where("quadroId = :boardId", { boardId })
        .andWhere("ordem > :ordemDeletada", { ordemDeletada })
        .execute();

      res.json({ cardsDeleted: cardsCount });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao deletar lista" });
    }
  }
);

export default router;
