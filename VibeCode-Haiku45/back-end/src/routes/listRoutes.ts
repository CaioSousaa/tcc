import { Router } from "express";
import { AppDataSource } from "../database";
import { List } from "../entities/List";
import { Board } from "../entities/Board";
import { ListService } from "../services/ListService";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
router.use(authMiddleware);

router.post("/:boardId", async (req: AuthRequest, res) => {
  try {
    const rawBoardId = req.params.boardId;
    const boardId = (Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId) || "";
    const { title } = req.body;
    const userId = req.userId!;

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const listRepository = AppDataSource.getRepository(List);
    const boardRepository = AppDataSource.getRepository(Board);
    const listService = new ListService(listRepository, boardRepository);

    const list = await listService.createList(boardId, userId, title);
    res.status(201).json(list);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create list";
    res.status(400).json({ error: errorMessage });
  }
});

router.get("/:boardId", async (req: AuthRequest, res) => {
  try {
    const rawBoardId = req.params.boardId;
    const boardId = (Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId) || "";
    const userId = req.userId!;

    const listRepository = AppDataSource.getRepository(List);
    const boardRepository = AppDataSource.getRepository(Board);
    const listService = new ListService(listRepository, boardRepository);

    const lists = await listService.getListsByBoard(boardId, userId);
    res.json(lists);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch lists";
    res.status(400).json({ error: errorMessage });
  }
});

router.patch("/:listId", async (req: AuthRequest, res) => {
  try {
    const rawListId = req.params.listId;
    const listId = (Array.isArray(rawListId) ? rawListId[0] : rawListId) || "";
    const { title, position } = req.body;
    const userId = req.userId!;

    const listRepository = AppDataSource.getRepository(List);
    const boardRepository = AppDataSource.getRepository(Board);
    const listService = new ListService(listRepository, boardRepository);

    let list;
    if (title !== undefined) {
      list = await listService.updateListTitle(listId, userId, title);
    }
    if (position !== undefined) {
      list = await listService.reorderList(listId, userId, position);
    }

    if (!list) {
      res.status(404).json({ error: "List not found" });
      return;
    }

    res.json(list);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update list";
    res.status(400).json({ error: errorMessage });
  }
});

router.delete("/:listId", async (req: AuthRequest, res) => {
  try {
    const rawListId = req.params.listId;
    const listId = (Array.isArray(rawListId) ? rawListId[0] : rawListId) || "";
    const userId = req.userId!;

    const listRepository = AppDataSource.getRepository(List);
    const boardRepository = AppDataSource.getRepository(Board);
    const listService = new ListService(listRepository, boardRepository);

    await listService.deleteList(listId, userId);
    res.json({ message: "List deleted successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete list";
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
