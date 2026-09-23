import { Router } from "express";
import { AppDataSource } from "../database";
import { Label } from "../entities/Label";
import { Card } from "../entities/Card";
import { Board } from "../entities/Board";
import { LabelService } from "../services/LabelService";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
router.use(authMiddleware);

router.post("/:boardId", async (req: AuthRequest, res) => {
  try {
    const rawBoardId = req.params.boardId;
    const boardId = (Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId) || "";
    const { name, color } = req.body;
    const userId = req.userId!;

    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const labelRepo = AppDataSource.getRepository(Label);
    const cardRepo = AppDataSource.getRepository(Card);
    const boardRepo = AppDataSource.getRepository(Board);
    const service = new LabelService(labelRepo, cardRepo, boardRepo);

    const label = await service.createLabel(boardId, userId, name, color);
    res.status(201).json(label);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create label";
    res.status(400).json({ error: errorMessage });
  }
});

router.get("/:boardId", async (req: AuthRequest, res) => {
  try {
    const rawBoardId = req.params.boardId;
    const boardId = (Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId) || "";

    const labelRepo = AppDataSource.getRepository(Label);
    const cardRepo = AppDataSource.getRepository(Card);
    const boardRepo = AppDataSource.getRepository(Board);
    const service = new LabelService(labelRepo, cardRepo, boardRepo);

    const labels = await service.getLabels(boardId);
    res.json(labels);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch labels";
    res.status(400).json({ error: errorMessage });
  }
});

router.patch("/:labelId", async (req: AuthRequest, res) => {
  try {
    const rawLabelId = req.params.labelId;
    const labelId = (Array.isArray(rawLabelId) ? rawLabelId[0] : rawLabelId) || "";
    const { name, color } = req.body;
    const userId = req.userId!;

    const labelRepo = AppDataSource.getRepository(Label);
    const cardRepo = AppDataSource.getRepository(Card);
    const boardRepo = AppDataSource.getRepository(Board);
    const service = new LabelService(labelRepo, cardRepo, boardRepo);

    const label = await service.updateLabel(labelId, userId, { name, color });
    res.json(label);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update label";
    res.status(400).json({ error: errorMessage });
  }
});

router.delete("/:labelId", async (req: AuthRequest, res) => {
  try {
    const rawLabelId = req.params.labelId;
    const labelId = (Array.isArray(rawLabelId) ? rawLabelId[0] : rawLabelId) || "";
    const userId = req.userId!;

    const labelRepo = AppDataSource.getRepository(Label);
    const cardRepo = AppDataSource.getRepository(Card);
    const boardRepo = AppDataSource.getRepository(Board);
    const service = new LabelService(labelRepo, cardRepo, boardRepo);

    await service.deleteLabel(labelId, userId);
    res.json({ message: "Label deleted" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete label";
    res.status(400).json({ error: errorMessage });
  }
});

router.post("/:cardId/add/:labelId", async (req: AuthRequest, res) => {
  try {
    const rawCardId = req.params.cardId;
    const rawLabelId = req.params.labelId;
    const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId) || "";
    const labelId = (Array.isArray(rawLabelId) ? rawLabelId[0] : rawLabelId) || "";
    const userId = req.userId!;

    const labelRepo = AppDataSource.getRepository(Label);
    const cardRepo = AppDataSource.getRepository(Card);
    const boardRepo = AppDataSource.getRepository(Board);
    const service = new LabelService(labelRepo, cardRepo, boardRepo);

    const card = await service.addLabelToCard(cardId, labelId, userId);
    res.json(card);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to add label";
    res.status(400).json({ error: errorMessage });
  }
});

router.post("/:cardId/remove/:labelId", async (req: AuthRequest, res) => {
  try {
    const rawCardId = req.params.cardId;
    const rawLabelId = req.params.labelId;
    const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId) || "";
    const labelId = (Array.isArray(rawLabelId) ? rawLabelId[0] : rawLabelId) || "";
    const userId = req.userId!;

    const labelRepo = AppDataSource.getRepository(Label);
    const cardRepo = AppDataSource.getRepository(Card);
    const boardRepo = AppDataSource.getRepository(Board);
    const service = new LabelService(labelRepo, cardRepo, boardRepo);

    const card = await service.removeLabelFromCard(cardId, labelId, userId);
    res.json(card);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to remove label";
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
