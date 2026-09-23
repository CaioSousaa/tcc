import { Router, Response } from "express";
import { AppDataSource } from "../database";
import { CardAssignee } from "../entities/CardAssignee";
import { Card } from "../entities/Card";
import { List } from "../entities/List";
import { Board } from "../entities/Board";
import { BoardMember } from "../entities/BoardMember";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });
const cardAssigneeRepository = AppDataSource.getRepository(CardAssignee);
const cardRepository = AppDataSource.getRepository(Card);
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

    const assignees = await cardAssigneeRepository.find({
      where: { cardId },
      relations: { user: true },
    });

    res.json(
      assignees.map((a) => ({
        id: a.id,
        userId: a.user.id,
        email: a.user.email,
        nome: a.user.nome,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar atribuídos" });
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

    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "userId é obrigatório" });
      return;
    }

    const member = await boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    if (!member && userId !== (await boardRepository.findOne({ where: { id: boardId } }))?.usuarioId) {
      res.status(404).json({ error: "Usuário não é membro do quadro" });
      return;
    }

    let assignee = await cardAssigneeRepository.findOne({
      where: { cardId, userId },
    });

    if (assignee) {
      res.status(400).json({ error: "Usuário já atribuído" });
      return;
    }

    assignee = cardAssigneeRepository.create({
      cardId,
      userId,
    });

    await cardAssigneeRepository.save(assignee);

    res.status(201).json({
      id: assignee.id,
      userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atribuir membro" });
  }
});

router.delete(
  "/:userId",
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
      const userId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;

      if (!boardId || !listId || !cardId || !userId) {
        res.status(400).json({ error: "IDs inválidos" });
        return;
      }

      const card = await checkCardAccess(boardId, listId, cardId, req.userId);
      if (!card) {
        res.status(404).json({ error: "Cartão não encontrado" });
        return;
      }

      const assignee = await cardAssigneeRepository.findOne({
        where: { cardId, userId },
      });

      if (!assignee) {
        res.status(404).json({ error: "Atribuição não encontrada" });
        return;
      }

      await cardAssigneeRepository.remove(assignee);

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao remover atribuição" });
    }
  }
);

export default router;
