import { Router, Request, Response, NextFunction } from "express";
import { ColumnService } from "../services/ColumnService";
import { CardRepository } from "../repositories/CardRepository";
import { requireAuth, validateBoardAccess } from "../middlewares";
import { ValidationError, ConflictError, NotFoundError } from "../types/errors";

const router = Router({ mergeParams: true });
const columnService = new ColumnService();
const cardRepository = new CardRepository();

router.post(
  "/",
  requireAuth,
  validateBoardAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = req.boardId!;
      const userId = req.userId!;
      const { name } = req.body;

      const column = await columnService.createColumn(boardId, userId, name);

      res.status(201).json({
        id: column.id,
        board_id: column.board_id,
        name: column.name,
        position: column.position,
        created_at: column.created_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Nome não pode estar vazio") {
          next(new ValidationError("Nome não pode estar vazio"));
        } else if (error.message === "Nome muito longo (máximo 100 caracteres)") {
          next(new ValidationError("Nome muito longo (máximo 100 caracteres)"));
        } else if (error.message === "Já existe uma lista com este nome neste quadro") {
          next(new ConflictError("Já existe uma lista com este nome neste quadro"));
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

router.get(
  "/",
  requireAuth,
  validateBoardAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = req.boardId!;
      const userId = req.userId!;

      const columns = await columnService.getColumnsByBoard(boardId, userId);

      const cardCounts = await cardRepository.countGroupedByList(boardId);

      const columnsResponse = columns.map((col) => ({
        id: col.id,
        name: col.name,
        position: col.position,
        card_count: cardCounts[col.id] ?? 0,
      }));

      res.status(200).json({
        columns: columnsResponse,
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
  "/:columnId",
  requireAuth,
  validateBoardAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = req.boardId!;
      const userId = req.userId!;
      const columnId = typeof req.params.columnId === "string" ? req.params.columnId : undefined;

      if (!columnId) {
        next(new ValidationError("ID da lista não fornecido"));
        return;
      }
      const { name, position } = req.body;

      let column;

      if (name !== undefined) {
        column = await columnService.updateColumn(columnId, boardId, userId, { name });
      } else if (position !== undefined) {
        const columns = await columnService.getColumnsByBoard(boardId, userId);
        const updatedColumns = columns.map((col) => ({
          id: col.id,
          position: col.id === columnId ? position : col.position,
        }));

        const reordered = await columnService.reorderColumns(
          boardId,
          userId,
          updatedColumns
        );
        column = reordered.find((c) => c.id === columnId)!;
      } else {
        throw new Error("Name or position required");
      }

      res.status(200).json({
        id: column.id,
        name: column.name,
        position: column.position,
        updated_at: column.updated_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Nome não pode estar vazio") {
          next(new ValidationError("Nome não pode estar vazio"));
        } else if (error.message === "Nome muito longo (máximo 100 caracteres)") {
          next(new ValidationError("Nome muito longo (máximo 100 caracteres)"));
        } else if (error.message === "Já existe uma lista com este nome neste quadro") {
          next(new ConflictError("Já existe uma lista com este nome neste quadro"));
        } else if (error.message === "Lista não encontrada" || error.message === "Quadro não encontrado") {
          next(new NotFoundError("Lista não encontrada"));
        } else if (error.message === "Posições inválidas") {
          next(new ValidationError("Posições inválidas"));
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
  "/:columnId",
  requireAuth,
  validateBoardAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = req.boardId!;
      const userId = req.userId!;
      const columnId = typeof req.params.columnId === "string" ? req.params.columnId : undefined;

      if (!columnId) {
        next(new ValidationError("ID da lista não fornecido"));
        return;
      }

      await columnService.deleteColumn(columnId, boardId, userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "Lista não encontrada" ||
          error.message === "Quadro não encontrado"
        ) {
          next(new NotFoundError("Lista não encontrada"));
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
