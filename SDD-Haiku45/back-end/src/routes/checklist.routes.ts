import { Router, Request, Response, NextFunction } from "express";
import { ChecklistService } from "../services/ChecklistService";
import { requireAuth } from "../middlewares";
import { ValidationError, NotFoundError } from "../types/errors";

const router = Router();
const checklistService = new ChecklistService();

// POST /boards/:boardId/cards/:cardId/checklist - Create checklist
router.post(
  "/boards/:boardId/cards/:cardId/checklist",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const userId = req.userId!;

      const checklist = await checklistService.createChecklist(boardId, cardId, userId);

      res.status(201).json({
        id: checklist.id,
        card_id: checklist.card_id,
        items: [],
        progress: { completed: 0, total: 0, percentage: 0 },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("already has a checklist")) {
          next(new ValidationError(error.message));
        } else if (error.message.includes("not found")) {
          next(new NotFoundError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

// GET /boards/:boardId/cards/:cardId/checklist - Get checklist with progress
router.get(
  "/boards/:boardId/cards/:cardId/checklist",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";

      const checklistRepo = new (await import("../repositories/ChecklistRepository")).ChecklistRepository();
      const checklist = await checklistRepo.findByCardId(cardId);

      if (!checklist) {
        res.status(404).json({ error: "Checklist not found" });
        return;
      }

      const progress = await checklistService.getProgress(checklist.id);

      res.json({
        id: checklist.id,
        card_id: checklist.card_id,
        items: checklist.items || [],
        progress,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /boards/:boardId/cards/:cardId/checklist - Delete checklist
router.delete(
  "/boards/:boardId/cards/:cardId/checklist",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const userId = req.userId!;

      const checklistRepo = new (await import("../repositories/ChecklistRepository")).ChecklistRepository();
      const checklist = await checklistRepo.findByCardId(cardId);

      if (!checklist) {
        next(new NotFoundError("Checklist not found"));
        return;
      }

      await checklistService.deleteChecklist(boardId, cardId, checklist.id, userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          next(new NotFoundError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

// POST /boards/:boardId/cards/:cardId/checklist/items - Add item
router.post(
  "/boards/:boardId/cards/:cardId/checklist/items",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const { title } = req.body;
      const userId = req.userId!;

      if (!title) {
        next(new ValidationError("Item title is required"));
        return;
      }

      const checklistRepo = new (await import("../repositories/ChecklistRepository")).ChecklistRepository();
      const checklist = await checklistRepo.findByCardId(cardId);

      if (!checklist) {
        next(new NotFoundError("Checklist not found"));
        return;
      }

      const item = await checklistService.addItem(checklist.id, title, userId);

      res.status(201).json({
        id: item.id,
        checklist_id: item.checklist_id,
        title: item.title,
        is_completed: item.is_completed,
        position: item.position,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("between 1 and 500")) {
          next(new ValidationError(error.message));
        } else if (error.message.includes("not found")) {
          next(new NotFoundError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

// PUT /boards/:boardId/cards/:cardId/checklist/items/:itemId - Update item
router.put(
  "/boards/:boardId/cards/:cardId/checklist/items/:itemId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const itemId = typeof req.params.itemId === "string" ? req.params.itemId : "";
      const { title, is_completed } = req.body;
      const userId = req.userId!;

      const checklistRepo = new (await import("../repositories/ChecklistRepository")).ChecklistRepository();
      const checklist = await checklistRepo.findByCardId(cardId);

      if (!checklist) {
        next(new NotFoundError("Checklist not found"));
        return;
      }

      const item = await checklistService.updateItem(
        checklist.id,
        itemId,
        { title, is_completed },
        userId
      );

      res.json({
        id: item.id,
        title: item.title,
        is_completed: item.is_completed,
        position: item.position,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("between 1 and 500")) {
          next(new ValidationError(error.message));
        } else if (error.message.includes("not found")) {
          next(new NotFoundError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

// DELETE /boards/:boardId/cards/:cardId/checklist/items/:itemId - Delete item
router.delete(
  "/boards/:boardId/cards/:cardId/checklist/items/:itemId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const itemId = typeof req.params.itemId === "string" ? req.params.itemId : "";
      const userId = req.userId!;

      const checklistRepo = new (await import("../repositories/ChecklistRepository")).ChecklistRepository();
      const checklist = await checklistRepo.findByCardId(cardId);

      if (!checklist) {
        next(new NotFoundError("Checklist not found"));
        return;
      }

      await checklistService.removeItem(checklist.id, itemId, userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          next(new NotFoundError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

export default router;
