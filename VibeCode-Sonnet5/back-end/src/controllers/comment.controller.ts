import { Request, Response } from "express";
import { AppDataSource } from "../utils/data-source";
import { findAccessibleCard } from "../utils/ownership";
import { Comment } from "../entities/Comment";

const MAX_TEXT_LENGTH = 2000;

function toCommentResponse(comment: Comment) {
  return {
    id: comment.id,
    text: comment.text,
    cardId: comment.cardId,
    authorId: comment.authorId,
    authorName: comment.author.name,
    createdAt: comment.createdAt,
  };
}

export async function listComments(req: Request, res: Response): Promise<void> {
  const card = await findAccessibleCard(
    req.params.boardId as string,
    req.params.cardId as string,
    req.userId as string,
  );
  if (!card) {
    res.status(404).json({ error: "Card não encontrado." });
    return;
  }

  const commentRepository = AppDataSource.getRepository(Comment);
  const comments = await commentRepository.find({
    where: { cardId: card.id },
    relations: { author: true },
    order: { createdAt: "ASC" },
  });

  res.status(200).json({ comments: comments.map(toCommentResponse) });
}

export async function createComment(req: Request, res: Response): Promise<void> {
  const { text } = req.body as { text?: string };

  if (!text?.trim()) {
    res.status(400).json({ error: "Comentário não pode ser vazio." });
    return;
  }

  if (text.trim().length > MAX_TEXT_LENGTH) {
    res
      .status(400)
      .json({ error: `Comentário deve ter no máximo ${MAX_TEXT_LENGTH} caracteres.` });
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

  const commentRepository = AppDataSource.getRepository(Comment);
  const comment = commentRepository.create({
    text: text.trim(),
    cardId: card.id,
    authorId: req.userId as string,
  });
  await commentRepository.save(comment);

  const saved = await commentRepository.findOne({
    where: { id: comment.id },
    relations: { author: true },
  });

  res.status(201).json({ comment: toCommentResponse(saved as Comment) });
}
