import { Router, Request, Response, NextFunction } from "express";
import { LabelService } from "../services/LabelService";
import { requireAuth } from "../middlewares";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from "../types/errors";

const router = Router();
const labelService = new LabelService();

router.post(
  "/boards/:boardId/labels",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const { name, color } = req.body;
      const userId = req.userId!;

      if (!name) {
        next(new ValidationError("Nome é obrigatório"));
        return;
      }

      if (!color) {
        next(new ValidationError("Cor é obrigatória"));
        return;
      }

      const label = await labelService.createLabel(boardId, name, color, userId);

      res.status(201).json({
        id: label.id,
        board_id: label.board_id,
        name: label.name,
        color: label.color,
        created_at: label.created_at,
        updated_at: label.updated_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Nome") || error.message.includes("Cor")) {
          next(new ValidationError(error.message));
        } else if (error.message.includes("Já existe")) {
          next(new ConflictError(error.message));
        } else if (error.message.includes("administrador") || error.message.includes("editor")) {
          next(new ForbiddenError(error.message));
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
  "/boards/:boardId/labels",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";

      const labels = await labelService.getLabelsOfBoard(boardId);

      res.json({
        labels: labels.map((l) => ({
          id: l.id,
          name: l.name,
          color: l.color,
          card_count: l.card_count,
          created_at: l.created_at,
          updated_at: l.updated_at,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/boards/:boardId/labels/:labelId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const labelId = typeof req.params.labelId === "string" ? req.params.labelId : "";
      const { name, color } = req.body;
      const userId = req.userId!;

      if (!name) {
        next(new ValidationError("Nome é obrigatório"));
        return;
      }

      if (!color) {
        next(new ValidationError("Cor é obrigatória"));
        return;
      }

      const label = await labelService.updateLabel(boardId, labelId, name, color, userId);

      res.json({
        id: label.id,
        name: label.name,
        color: label.color,
        updated_at: label.updated_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Nome") || error.message.includes("Cor")) {
          next(new ValidationError(error.message));
        } else if (error.message.includes("Já existe")) {
          next(new ConflictError(error.message));
        } else if (error.message.includes("administrador") || error.message.includes("editor")) {
          next(new ForbiddenError(error.message));
        } else if (error.message.includes("não encontrada")) {
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

router.delete(
  "/boards/:boardId/labels/:labelId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const labelId = typeof req.params.labelId === "string" ? req.params.labelId : "";
      const userId = req.userId!;

      await labelService.deleteLabel(boardId, labelId, userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("administrador") || error.message.includes("editor")) {
          next(new ForbiddenError(error.message));
        } else if (error.message.includes("não encontrada")) {
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

router.post(
  "/boards/:boardId/cards/:cardId/labels",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const { label_id } = req.body;
      const userId = req.userId!;

      if (!label_id) {
        next(new ValidationError("label_id é obrigatório"));
        return;
      }

      const cardLabel = await labelService.applyLabel(boardId, cardId, label_id, userId);

      res.status(201).json({
        id: cardLabel.id,
        card_id: cardLabel.card_id,
        label_id: cardLabel.label_id,
        created_at: cardLabel.created_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Etiqueta já foi aplicada")) {
          next(new ValidationError(error.message));
        } else if (error.message.includes("administrador") || error.message.includes("editor")) {
          next(new ForbiddenError(error.message));
        } else if (error.message.includes("não encontrada")) {
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

router.delete(
  "/boards/:boardId/cards/:cardId/labels/:cardLabelId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const cardLabelId = typeof req.params.cardLabelId === "string" ? req.params.cardLabelId : "";
      const userId = req.userId!;

      await labelService.removeLabel(boardId, cardId, cardLabelId, userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("administrador") || error.message.includes("editor")) {
          next(new ForbiddenError(error.message));
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
  "/cards/:cardId/labels",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";

      const labels = await labelService.getCardLabelLinks(cardId);

      res.json({
        labels: labels.map((l) => ({
          id: l.id,
          card_label_id: l.card_label_id,
          name: l.name,
          color: l.color,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
