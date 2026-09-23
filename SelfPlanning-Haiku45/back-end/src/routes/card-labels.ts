import { Router, Response } from "express";
import { AppDataSource } from "../database";
import { CardLabel } from "../entities/CardLabel";
import { Card } from "../entities/Card";
import { Label } from "../entities/Label";
import { List } from "../entities/List";
import { Board } from "../entities/Board";
import { BoardMember } from "../entities/BoardMember";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });
const cardLabelRepository = AppDataSource.getRepository(CardLabel);
const cardRepository = AppDataSource.getRepository(Card);
const labelRepository = AppDataSource.getRepository(Label);
const listRepository = AppDataSource.getRepository(List);
const boardRepository = AppDataSource.getRepository(Board);
const boardMemberRepository = AppDataSource.getRepository(BoardMember);

async function checkCardAccess(
  boardId: string,
  listId: string,
  cardId: string,
  userId: string
): Promise<Card | null> {
  const board = await boardRepository.findOne({
    where: { id: boardId, usuarioId: userId },
  });
  if (!board) {
    const member = await boardMemberRepository.findOne({
      where: { boardId, userId },
    });
    if (!member) return null;
  }

  const list = await listRepository.findOne({
    where: { id: listId, quadroId: boardId },
  });
  if (!list) return null;

  return cardRepository.findOne({
    where: { id: cardId, listaId: listId },
  });
}

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

    const card = await checkCardAccess(boardId, listId, cardId, req.userId);
    if (!card) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }

    const cardLabels = await cardLabelRepository.find({
      where: { cardId },
      relations: { label: true },
    });

    res.json(
      cardLabels.map((cl) => ({
        id: cl.label.id,
        nome: cl.label.nome,
        cor: cl.label.cor,
        dataCriacao: cl.label.dataCriacao,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar etiquetas do cartão" });
  }
});

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

    const card = await checkCardAccess(boardId, listId, cardId, req.userId);
    if (!card) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }

    const { labelId } = req.body;

    if (!labelId) {
      res.status(400).json({ error: "labelId é obrigatório" });
      return;
    }

    const label = await labelRepository.findOne({
      where: { id: labelId, boardId },
    });

    if (!label) {
      res.status(404).json({ error: "Etiqueta não encontrada ou não pertence ao quadro" });
      return;
    }

    const existing = await cardLabelRepository.findOne({
      where: { cardId, labelId },
    });

    if (existing) {
      res.status(400).json({ error: "Etiqueta já adicionada ao cartão" });
      return;
    }

    const cardLabel = cardLabelRepository.create({
      cardId,
      labelId,
    });

    await cardLabelRepository.save(cardLabel);

    res.status(201).json({
      id: label.id,
      nome: label.nome,
      cor: label.cor,
      dataCriacao: label.dataCriacao,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao adicionar etiqueta ao cartão" });
  }
});

router.delete("/:labelId", verifyToken, async (req: AuthRequest, res: Response) => {
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
    const labelId = Array.isArray(req.params.labelId)
      ? req.params.labelId[0]
      : req.params.labelId;

    if (!boardId || !listId || !cardId || !labelId) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }

    const card = await checkCardAccess(boardId, listId, cardId, req.userId);
    if (!card) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }

    const cardLabel = await cardLabelRepository.findOne({
      where: { cardId, labelId },
    });

    if (!cardLabel) {
      res.status(404).json({ error: "Etiqueta não encontrada no cartão" });
      return;
    }

    await cardLabelRepository.remove(cardLabel);

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao remover etiqueta do cartão" });
  }
});

export default router;
