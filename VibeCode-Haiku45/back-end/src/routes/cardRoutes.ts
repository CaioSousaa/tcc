import { Router } from "express";
import { AppDataSource } from "../database";
import { Card } from "../entities/Card";
import { List } from "../entities/List";
import { Board } from "../entities/Board";
import { CardService } from "../services/CardService";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
router.use(authMiddleware);

router.post("/:listId", async (req: AuthRequest, res) => {
  try {
    const rawListId = req.params.listId;
    const listId = (Array.isArray(rawListId) ? rawListId[0] : rawListId) || "";
    const { title, description } = req.body;
    const userId = req.userId!;

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const cardRepository = AppDataSource.getRepository(Card);
    const listRepository = AppDataSource.getRepository(List);
    const boardRepository = AppDataSource.getRepository(Board);
    const cardService = new CardService(cardRepository, listRepository, boardRepository);

    const card = await cardService.createCard(listId, userId, title, description);
    res.status(201).json(card);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create card";
    res.status(400).json({ error: errorMessage });
  }
});

router.get("/list/:listId", async (req: AuthRequest, res) => {
  try {
    const rawListId = req.params.listId;
    const listId = (Array.isArray(rawListId) ? rawListId[0] : rawListId) || "";
    const userId = req.userId!;

    const cardRepository = AppDataSource.getRepository(Card);
    const listRepository = AppDataSource.getRepository(List);
    const boardRepository = AppDataSource.getRepository(Board);
    const cardService = new CardService(cardRepository, listRepository, boardRepository);

    const cards = await cardService.getCardsByList(listId, userId);
    res.json(cards);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch cards";
    res.status(400).json({ error: errorMessage });
  }
});

router.patch("/:cardId", async (req: AuthRequest, res) => {
  try {
    const rawCardId = req.params.cardId;
    const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId) || "";
    const { title, description, listId, position } = req.body;
    const userId = req.userId!;

    const cardRepository = AppDataSource.getRepository(Card);
    const listRepository = AppDataSource.getRepository(List);
    const boardRepository = AppDataSource.getRepository(Board);
    const cardService = new CardService(cardRepository, listRepository, boardRepository);

    let card;
    if (listId !== undefined && position !== undefined) {
      card = await cardService.moveCard(cardId, userId, listId, position);
    } else {
      card = await cardService.updateCard(cardId, userId, { title, description });
    }

    res.json(card);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update card";
    res.status(400).json({ error: errorMessage });
  }
});

router.delete("/:cardId", async (req: AuthRequest, res) => {
  try {
    const rawCardId = req.params.cardId;
    const cardId = (Array.isArray(rawCardId) ? rawCardId[0] : rawCardId) || "";
    const userId = req.userId!;

    const cardRepository = AppDataSource.getRepository(Card);
    const listRepository = AppDataSource.getRepository(List);
    const boardRepository = AppDataSource.getRepository(Board);
    const cardService = new CardService(cardRepository, listRepository, boardRepository);

    await cardService.deleteCard(cardId, userId);
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete card";
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
