import { Router, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../database";
import { Card } from "../entities/Card";
import { CardLabel } from "../entities/CardLabel";
import { List } from "../entities/List";
import { Board } from "../entities/Board";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });
const cardRepository = AppDataSource.getRepository(Card);
const cardLabelRepository = AppDataSource.getRepository(CardLabel);
const listRepository = AppDataSource.getRepository(List);
const boardRepository = AppDataSource.getRepository(Board);

function validateTitle(titulo: unknown): boolean {
  if (typeof titulo !== "string") return false;
  return titulo.trim().length > 0 && titulo.length <= 100;
}

async function checkBoardOwnership(
  boardId: string,
  userId: string
): Promise<Board | null> {
  return boardRepository.findOne({
    where: { id: boardId, usuarioId: userId },
  });
}

async function checkListOwnership(
  boardId: string,
  listId: string,
  userId: string
): Promise<List | null> {
  const board = await checkBoardOwnership(boardId, userId);
  if (!board) return null;

  return listRepository.findOne({
    where: { id: listId, quadroId: boardId },
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

    if (!boardId || !listId) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }

    const list = await checkListOwnership(boardId, listId, req.userId);
    if (!list) {
      res.status(404).json({ error: "Lista não encontrada" });
      return;
    }

    const { titulo, descricao } = req.body;

    if (!validateTitle(titulo)) {
      res.status(400).json({ error: "Título inválido (1-100 caracteres)" });
      return;
    }

    const maxOrder = await cardRepository
      .createQueryBuilder("card")
      .where("card.listaId = :listId", { listId })
      .select("MAX(card.ordem)", "max")
      .getRawOne();

    const newOrder = (maxOrder?.max || 0) + 1;

    const card = cardRepository.create({
      listaId: listId,
      titulo: titulo.trim(),
      descricao: descricao || undefined,
      ordem: newOrder,
    });

    await cardRepository.save(card);

    res.status(201).json(card);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar cartão" });
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

    if (!boardId || !listId) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }

    const list = await checkListOwnership(boardId, listId, req.userId);
    if (!list) {
      res.status(404).json({ error: "Lista não encontrada" });
      return;
    }

    const labelsParam = req.query.labels as string | undefined;
    let cards = await cardRepository.find({
      where: { listaId: listId },
      order: { ordem: "ASC" },
    });

    if (labelsParam) {
      const labelIds = labelsParam.split(",").filter((id) => id.trim().length > 0);
      if (labelIds.length > 0) {
        const cardLabels = await cardLabelRepository.find({
          where: { labelId: In(labelIds) },
        });

        const cardIdsWithLabels = new Set(cardLabels.map((cl) => cl.cardId));
        cards = cards.filter((card) => cardIdsWithLabels.has(card.id));
      }
    }

    const cardsWithDetails = await Promise.all(
      cards.map(async (card) => {
        const labels = await cardLabelRepository.find({
          where: { cardId: card.id },
          relations: { label: true },
        });
        return {
          ...card,
          statusPrazo: card.getStatusPrazo(),
          labels: labels.map((cl) => ({
            id: cl.label.id,
            nome: cl.label.nome,
            cor: cl.label.cor,
          })),
        };
      })
    );

    res.json(cardsWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar cartões" });
  }
});

router.get(
  "/:cardId",
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

      if (!boardId || !listId || !cardId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const list = await checkListOwnership(boardId, listId, req.userId);
      if (!list) {
        res.status(404).json({ error: "Lista não encontrada" });
        return;
      }

      const card = await cardRepository.findOne({
        where: { id: cardId, listaId: listId },
      });

      if (!card) {
        res.status(404).json({ error: "Cartão não encontrado" });
        return;
      }

      res.json(card);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar cartão" });
    }
  }
);

router.patch(
  "/:cardId",
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

      if (!boardId || !listId || !cardId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const list = await checkListOwnership(boardId, listId, req.userId);
      if (!list) {
        res.status(404).json({ error: "Lista não encontrada" });
        return;
      }

      const card = await cardRepository.findOne({
        where: { id: cardId, listaId: listId },
      });

      if (!card) {
        res.status(404).json({ error: "Cartão não encontrado" });
        return;
      }

      const { titulo, descricao, dataPrazo } = req.body;

      if (titulo !== undefined) {
        if (!validateTitle(titulo)) {
          res.status(400).json({ error: "Título inválido (1-100 caracteres)" });
          return;
        }
        card.titulo = titulo.trim();
      }

      if (descricao !== undefined) {
        card.descricao = descricao || undefined;
      }

      if (dataPrazo !== undefined) {
        if (dataPrazo === null) {
          card.dataPrazo = undefined as any;
        } else {
          const prazo = new Date(dataPrazo);
          if (isNaN(prazo.getTime())) {
            res.status(400).json({ error: "Data de prazo inválida" });
            return;
          }
          card.dataPrazo = prazo;
        }
      }

      await cardRepository.save(card);

      res.json({
        ...card,
        statusPrazo: card.getStatusPrazo(),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao atualizar cartão" });
    }
  }
);

router.patch(
  "/:cardId/move",
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

      if (!boardId || !listId || !cardId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const list = await checkListOwnership(boardId, listId, req.userId);
      if (!list) {
        res.status(404).json({ error: "Lista de origem não encontrada" });
        return;
      }

      const card = await cardRepository.findOne({
        where: { id: cardId, listaId: listId },
      });

      if (!card) {
        res.status(404).json({ error: "Cartão não encontrado" });
        return;
      }

      const { novaListaId, novaOrdem } = req.body;

      if (!novaListaId) {
        res.status(400).json({ error: "Nova lista não especificada" });
        return;
      }

      const novaLista = await checkListOwnership(boardId, novaListaId, req.userId);
      if (!novaLista) {
        res.status(404).json({ error: "Lista de destino não encontrada" });
        return;
      }

      const ordemAtual = card.ordem;
      const listaAntigaId = card.listaId;

      // Reorder cards in source list
      if (listaAntigaId !== novaListaId) {
        await AppDataSource.createQueryBuilder()
          .update(Card)
          .set({ ordem: () => "ordem - 1" })
          .where("listaId = :listId", { listId: listaAntigaId })
          .andWhere("ordem > :ordemAtual", { ordemAtual })
          .execute();
      }

      // Move card to new list
      card.listaId = novaListaId;

      // Assign new order in destination list
      if (novaOrdem !== undefined && typeof novaOrdem === "number") {
        await AppDataSource.createQueryBuilder()
          .update(Card)
          .set({ ordem: () => "ordem + 1" })
          .where("listaId = :listId", { listId: novaListaId })
          .andWhere("ordem >= :novaOrdem", { novaOrdem })
          .execute();

        card.ordem = novaOrdem;
      } else {
        const maxOrder = await cardRepository
          .createQueryBuilder("card")
          .where("card.listaId = :listId", { listId: novaListaId })
          .select("MAX(card.ordem)", "max")
          .getRawOne();

        card.ordem = (maxOrder?.max || 0) + 1;
      }

      await cardRepository.save(card);

      res.json(card);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao mover cartão" });
    }
  }
);

router.delete(
  "/:cardId",
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

      if (!boardId || !listId || !cardId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const list = await checkListOwnership(boardId, listId, req.userId);
      if (!list) {
        res.status(404).json({ error: "Lista não encontrada" });
        return;
      }

      const card = await cardRepository.findOne({
        where: { id: cardId, listaId: listId },
      });

      if (!card) {
        res.status(404).json({ error: "Cartão não encontrado" });
        return;
      }

      const ordemDeletada = card.ordem;

      await cardRepository.remove(card);

      await AppDataSource.createQueryBuilder()
        .update(Card)
        .set({ ordem: () => "ordem - 1" })
        .where("listaId = :listId", { listId })
        .andWhere("ordem > :ordemDeletada", { ordemDeletada })
        .execute();

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao deletar cartão" });
    }
  }
);

export default router;
