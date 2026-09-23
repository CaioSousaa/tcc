import { Router } from "express";
import { AppDataSource } from "../database";
import { ChecklistItem } from "../entities/ChecklistItem";
import { Card } from "../entities/Card";
import { ChecklistItemService } from "../services/ChecklistItemService";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
router.use(authMiddleware);

router.post("/:cardId", async (req: AuthRequest, res) => {
  try {
    const rawCardId = req.params.cardId;
    const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId) || "";
    const { title } = req.body;
    const userId = req.userId!;

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const checklistItemRepository = AppDataSource.getRepository(ChecklistItem);
    const cardRepository = AppDataSource.getRepository(Card);
    const service = new ChecklistItemService(checklistItemRepository, cardRepository);

    const item = await service.createChecklistItem(cardId, userId, title);
    res.status(201).json(item);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create checklist item";
    res.status(400).json({ error: errorMessage });
  }
});

router.get("/:cardId", async (req: AuthRequest, res) => {
  try {
    const rawCardId = req.params.cardId;
    const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId) || "";
    const userId = req.userId!;

    const checklistItemRepository = AppDataSource.getRepository(ChecklistItem);
    const cardRepository = AppDataSource.getRepository(Card);
    const service = new ChecklistItemService(checklistItemRepository, cardRepository);

    const items = await service.getChecklistItems(cardId, userId);
    res.json(items);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch checklist items";
    res.status(400).json({ error: errorMessage });
  }
});

router.patch("/:itemId", async (req: AuthRequest, res) => {
  try {
    const rawItemId = req.params.itemId;
    const itemId = (Array.isArray(rawItemId) ? rawItemId[0] : rawItemId) || "";
    const { title, completed } = req.body;
    const userId = req.userId!;

    const checklistItemRepository = AppDataSource.getRepository(ChecklistItem);
    const cardRepository = AppDataSource.getRepository(Card);
    const service = new ChecklistItemService(checklistItemRepository, cardRepository);

    const item = await service.updateChecklistItem(itemId, userId, { title, completed });
    res.json(item);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update checklist item";
    res.status(400).json({ error: errorMessage });
  }
});

router.delete("/:itemId", async (req: AuthRequest, res) => {
  try {
    const rawItemId = req.params.itemId;
    const itemId = (Array.isArray(rawItemId) ? rawItemId[0] : rawItemId) || "";
    const userId = req.userId!;

    const checklistItemRepository = AppDataSource.getRepository(ChecklistItem);
    const cardRepository = AppDataSource.getRepository(Card);
    const service = new ChecklistItemService(checklistItemRepository, cardRepository);

    await service.deleteChecklistItem(itemId, userId);
    res.json({ message: "Checklist item deleted successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete checklist item";
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
