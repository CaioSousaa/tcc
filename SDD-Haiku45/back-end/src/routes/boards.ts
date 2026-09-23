import { Router, Request, Response, NextFunction } from "express";
import { BoardService } from "../services/BoardService";
import { CardService } from "../services/CardService";
import { CardRepository } from "../repositories/CardRepository";
import { requireAuth, validateBoardAccess } from "../middlewares";
import { ValidationError, ConflictError, NotFoundError } from "../types/errors";

const router = Router();
const boardService = new BoardService();
const cardService = new CardService();
const cardRepository = new CardRepository();

router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const userId = req.userId!;

    const board = await boardService.createBoard(userId, name);

    res.status(201).json({
      id: board.id,
      name: board.name,
      created_at: board.created_at,
      columns: board.columns,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Nome não pode estar vazio") {
        next(new ValidationError("Nome não pode estar vazio"));
      } else if (error.message === "Nome muito longo (máximo 100 caracteres)") {
        next(new ValidationError("Nome muito longo (máximo 100 caracteres)"));
      } else if (error.message === "Já existe quadro com este nome") {
        next(new ConflictError("Já existe quadro com este nome"));
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
});

router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const boards = await boardService.getBoardsList(userId);

    const boardsResponse = await Promise.all(
      boards.map(async (board) => ({
        id: board.id,
        name: board.name,
        created_at: board.created_at,
        column_count: board.columns ? board.columns.length : 0,
        card_count: await cardRepository.countByBoard(board.id),
      }))
    );

    res.status(200).json({
      boards: boardsResponse,
    });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:boardId",
  requireAuth,
  validateBoardAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = req.boardId!;
      const userId = req.userId!;

      const board = await boardService.getBoard(boardId, userId);

      const columns = board.columns.map((col) => ({
        id: col.id,
        name: col.name,
        position: col.position,
        cards: [],
      }));

      res.status(200).json({
        id: board.id,
        name: board.name,
        created_at: board.created_at,
        updated_at: board.updated_at,
        columns,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Quadro não encontrado") {
        next(new NotFoundError("Quadro não encontrado"));
      } else {
        next(error);
      }
    }
  }
);

router.put(
  "/:boardId",
  requireAuth,
  validateBoardAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = req.boardId!;
      const userId = req.userId!;
      const { name } = req.body;

      const board = await boardService.updateBoard(boardId, userId, { name });

      res.status(200).json({
        id: board.id,
        name: board.name,
        updated_at: board.updated_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Nome não pode estar vazio") {
          next(new ValidationError("Nome não pode estar vazio"));
        } else if (error.message === "Nome muito longo (máximo 100 caracteres)") {
          next(new ValidationError("Nome muito longo (máximo 100 caracteres)"));
        } else if (error.message === "Já existe quadro com este nome") {
          next(new ConflictError("Já existe quadro com este nome"));
        } else if (error.message === "Quadro não encontrado") {
          next(new NotFoundError("Quadro não encontrado"));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

router.delete(
  "/:boardId",
  requireAuth,
  validateBoardAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = req.boardId!;
      const userId = req.userId!;

      await boardService.deleteBoard(boardId, userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === "Quadro não encontrado") {
        next(new NotFoundError("Quadro não encontrado"));
      } else {
        next(error);
      }
    }
  }
);

router.get(
  "/:boardId/cards",
  requireAuth,
  validateBoardAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = req.boardId!;
      const userId = req.userId!;
      const filter = (req.query.filter as string) || "no_due";

      const validFilters = ["overdue", "due_today", "next_7_days", "next_30_days", "no_due"];
      if (!validFilters.includes(filter)) {
        next(new ValidationError("Filtro inválido"));
        return;
      }

      const board = await boardService.getBoard(boardId, userId);
      if (!board) {
        next(new NotFoundError("Quadro não encontrado"));
        return;
      }

      const cards = await cardService.getCardsByDueFilter(
        boardId,
        filter as "overdue" | "due_today" | "next_7_days" | "next_30_days" | "no_due"
      );

      const cardsResponse = cards.map((card) => ({
        id: card.id,
        list_id: card.list_id,
        title: card.title,
        description: card.description,
        position: card.position,
        due_date: card.due_date,
      }));

      res.status(200).json({
        cards: cardsResponse,
        filter,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Quadro não encontrado") {
          next(new NotFoundError("Quadro não encontrado"));
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
