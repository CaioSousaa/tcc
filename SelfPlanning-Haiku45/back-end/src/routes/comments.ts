import { Router, Response } from "express";
import { AppDataSource } from "../database";
import { Comment } from "../entities/Comment";
import { Card } from "../entities/Card";
import { List } from "../entities/List";
import { Board } from "../entities/Board";
import { BoardMember } from "../entities/BoardMember";
import { User } from "../entities/User";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });
const commentRepository = AppDataSource.getRepository(Comment);
const cardRepository = AppDataSource.getRepository(Card);
const listRepository = AppDataSource.getRepository(List);
const boardRepository = AppDataSource.getRepository(Board);
const boardMemberRepository = AppDataSource.getRepository(BoardMember);
const userRepository = AppDataSource.getRepository(User);

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

    const comments = await commentRepository.find({
      where: { cardId },
      relations: { usuario: true },
      order: { dataCriacao: "DESC" },
    });

    res.json(
      comments.map((c) => ({
        id: c.id,
        cardId: c.cardId,
        usuarioId: c.usuarioId,
        texto: c.texto,
        dataCriacao: c.dataCriacao,
        dataAtualizacao: c.dataAtualizacao,
        usuario: {
          id: c.usuario.id,
          email: c.usuario.email,
          nome: c.usuario.nome,
        },
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar comentários" });
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

    const { texto } = req.body;

    if (!texto || typeof texto !== "string" || texto.trim().length === 0) {
      res.status(400).json({ error: "Texto do comentário é obrigatório" });
      return;
    }

    if (texto.length > 1000) {
      res.status(400).json({ error: "Comentário não pode ter mais de 1000 caracteres" });
      return;
    }

    const usuario = await userRepository.findOne({ where: { id: req.userId } });
    if (!usuario) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    const comment = commentRepository.create({
      cardId,
      usuarioId: req.userId,
      texto: texto.trim(),
    });

    await commentRepository.save(comment);

    res.status(201).json({
      id: comment.id,
      cardId: comment.cardId,
      usuarioId: comment.usuarioId,
      texto: comment.texto,
      dataCriacao: comment.dataCriacao,
      dataAtualizacao: comment.dataAtualizacao,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar comentário" });
  }
});

router.patch("/:commentId", verifyToken, async (req: AuthRequest, res: Response) => {
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
    const commentId = Array.isArray(req.params.commentId)
      ? req.params.commentId[0]
      : req.params.commentId;

    if (!boardId || !listId || !cardId || !commentId) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }

    const card = await checkCardAccess(boardId, listId, cardId, req.userId);
    if (!card) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }

    const comment = await commentRepository.findOne({
      where: { id: commentId, cardId },
      relations: { usuario: true },
    });

    if (!comment) {
      res.status(404).json({ error: "Comentário não encontrado" });
      return;
    }

    if (comment.usuarioId !== req.userId) {
      res.status(403).json({ error: "Apenas o autor pode editar o comentário" });
      return;
    }

    const { texto } = req.body;

    if (texto !== undefined) {
      if (typeof texto !== "string" || texto.trim().length === 0) {
        res.status(400).json({ error: "Texto do comentário é obrigatório" });
        return;
      }
      if (texto.length > 1000) {
        res.status(400).json({ error: "Comentário não pode ter mais de 1000 caracteres" });
        return;
      }
      comment.texto = texto.trim();
    }

    await commentRepository.save(comment);

    res.json({
      id: comment.id,
      cardId: comment.cardId,
      usuarioId: comment.usuarioId,
      texto: comment.texto,
      dataCriacao: comment.dataCriacao,
      dataAtualizacao: comment.dataAtualizacao,
      usuario: {
        id: comment.usuario.id,
        email: comment.usuario.email,
        nome: comment.usuario.nome,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar comentário" });
  }
});

router.delete("/:commentId", verifyToken, async (req: AuthRequest, res: Response) => {
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
    const commentId = Array.isArray(req.params.commentId)
      ? req.params.commentId[0]
      : req.params.commentId;

    if (!boardId || !listId || !cardId || !commentId) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }

    const card = await checkCardAccess(boardId, listId, cardId, req.userId);
    if (!card) {
      res.status(404).json({ error: "Cartão não encontrado" });
      return;
    }

    const comment = await commentRepository.findOne({
      where: { id: commentId, cardId },
    });

    if (!comment) {
      res.status(404).json({ error: "Comentário não encontrado" });
      return;
    }

    const board = await boardRepository.findOne({ where: { id: boardId } });
    const isBoardOwner = board?.usuarioId === req.userId;
    const isCommentAuthor = comment.usuarioId === req.userId;

    if (!isBoardOwner && !isCommentAuthor) {
      res.status(403).json({ error: "Não tem permissão para deletar este comentário" });
      return;
    }

    await commentRepository.remove(comment);

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar comentário" });
  }
});

export default router;
