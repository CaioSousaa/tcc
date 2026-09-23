import { Router } from "express";
import { AppDataSource } from "../database";
import { Comment } from "../entities/Comment";
import { Card } from "../entities/Card";
import { CommentService } from "../services/CommentService";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
router.use(authMiddleware);

router.post("/:cardId", async (req: AuthRequest, res) => {
  try {
    const rawCardId = req.params.cardId;
    const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId) || "";
    const { content } = req.body;
    const userId = req.userId!;

    if (!content) {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    const commentRepo = AppDataSource.getRepository(Comment);
    const cardRepo = AppDataSource.getRepository(Card);
    const service = new CommentService(commentRepo, cardRepo);

    const comment = await service.createComment(cardId, userId, content);
    res.status(201).json(comment);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create comment";
    res.status(400).json({ error: errorMessage });
  }
});

router.get("/:cardId", async (req: AuthRequest, res) => {
  try {
    const rawCardId = req.params.cardId;
    const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId) || "";

    const commentRepo = AppDataSource.getRepository(Comment);
    const cardRepo = AppDataSource.getRepository(Card);
    const service = new CommentService(commentRepo, cardRepo);

    const comments = await service.getComments(cardId);
    res.json(comments);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch comments";
    res.status(400).json({ error: errorMessage });
  }
});

router.delete("/:commentId", async (req: AuthRequest, res) => {
  try {
    const rawCommentId = req.params.commentId;
    const commentId = (Array.isArray(rawCommentId) ? rawCommentId[0] : rawCommentId) || "";
    const userId = req.userId!;

    const commentRepo = AppDataSource.getRepository(Comment);
    const cardRepo = AppDataSource.getRepository(Card);
    const service = new CommentService(commentRepo, cardRepo);

    await service.deleteComment(commentId, userId);
    res.json({ message: "Comment deleted" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete comment";
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
