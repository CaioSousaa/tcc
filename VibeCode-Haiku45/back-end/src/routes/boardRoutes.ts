import { Router } from "express";
import { AppDataSource } from "../database";
import { Board } from "../entities/Board";
import { BoardService } from "../services/BoardService";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
router.use(authMiddleware);

// Create board
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { title, description, color } = req.body;
    const userId = req.userId!;

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const boardRepository = AppDataSource.getRepository(Board);
    const boardService = new BoardService(boardRepository);

    const board = await boardService.createBoard(userId, title, description, color);
    res.status(201).json(board);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create board";
    res.status(400).json({ error: errorMessage });
  }
});

// Get user boards
router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const boardRepository = AppDataSource.getRepository(Board);
    const boardService = new BoardService(boardRepository);

    const boards = await boardService.getBoardsByUser(userId);
    res.json(boards);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch boards";
    res.status(400).json({ error: errorMessage });
  }
});

// Get single board
router.get("/:boardId", async (req: AuthRequest, res) => {
  try {
    const rawBoardId = req.params.boardId;
    const boardId = (Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId) || "";
    const userId = req.userId!;

    const boardRepository = AppDataSource.getRepository(Board);
    const boardService = new BoardService(boardRepository);

    const board = await boardService.getBoardById(boardId, userId);
    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }

    res.json(board);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch board";
    res.status(400).json({ error: errorMessage });
  }
});

// Update board
router.patch("/:boardId", async (req: AuthRequest, res) => {
  try {
    const rawBoardId = req.params.boardId;
    const boardId = (Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId) || "";
    const { title, description, color } = req.body;
    const userId = req.userId!;

    const boardRepository = AppDataSource.getRepository(Board);
    const boardService = new BoardService(boardRepository);

    const board = await boardService.updateBoard(boardId, userId, { title, description, color });
    res.json(board);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update board";
    res.status(400).json({ error: errorMessage });
  }
});

// Delete board
router.delete("/:boardId", async (req: AuthRequest, res) => {
  try {
    const rawBoardId = req.params.boardId;
    const boardId = (Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId) || "";
    const userId = req.userId!;

    const boardRepository = AppDataSource.getRepository(Board);
    const boardService = new BoardService(boardRepository);

    await boardService.deleteBoard(boardId, userId);
    res.json({ message: "Board deleted successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete board";
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
