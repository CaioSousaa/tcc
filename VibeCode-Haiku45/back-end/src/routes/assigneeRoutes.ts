import { Router } from "express";
import { AppDataSource } from "../database";
import { CardAssignee } from "../entities/CardAssignee";
import { Card } from "../entities/Card";
import { AssigneeService } from "../services/AssigneeService";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
router.use(authMiddleware);

router.post("/:cardId", async (req: AuthRequest, res) => {
  try {
    const rawCardId = req.params.cardId;
    const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId) || "";
    const { userId } = req.body;
    const currentUserId = req.userId!;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const assigneeRepo = AppDataSource.getRepository(CardAssignee);
    const cardRepo = AppDataSource.getRepository(Card);
    const service = new AssigneeService(assigneeRepo, cardRepo);

    const assignee = await service.assignUser(cardId, currentUserId, userId);
    res.status(201).json(assignee);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to assign user";
    res.status(400).json({ error: errorMessage });
  }
});

router.get("/:cardId", async (req: AuthRequest, res) => {
  try {
    const rawCardId = req.params.cardId;
    const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId) || "";

    const assigneeRepo = AppDataSource.getRepository(CardAssignee);
    const cardRepo = AppDataSource.getRepository(Card);
    const service = new AssigneeService(assigneeRepo, cardRepo);

    const assignees = await service.getAssignees(cardId);
    res.json(assignees);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch assignees";
    res.status(400).json({ error: errorMessage });
  }
});

router.delete("/:assigneeId", async (req: AuthRequest, res) => {
  try {
    const rawAssigneeId = req.params.assigneeId;
    const assigneeId = (Array.isArray(rawAssigneeId) ? rawAssigneeId[0] : rawAssigneeId) || "";
    const userId = req.userId!;

    const assigneeRepo = AppDataSource.getRepository(CardAssignee);
    const cardRepo = AppDataSource.getRepository(Card);
    const service = new AssigneeService(assigneeRepo, cardRepo);

    await service.removeAssignee(assigneeId, userId);
    res.json({ message: "Assignee removed" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to remove assignee";
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
