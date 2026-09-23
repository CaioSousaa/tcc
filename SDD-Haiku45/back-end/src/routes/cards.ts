import { Router, Request, Response, NextFunction } from "express";
import { CardService } from "../services/CardService";
import { CardLabelRepository } from "../repositories/CardLabelRepository";
import { CardAssignmentRepository } from "../repositories/CardAssignmentRepository";
import { ChecklistRepository } from "../repositories/ChecklistRepository";
import { requireAuth, validateListAccess } from "../middlewares";
import { ValidationError, ConflictError, NotFoundError } from "../types/errors";

const router = Router({ mergeParams: true });
const cardService = new CardService();
const cardLabelRepository = new CardLabelRepository();
const cardAssignmentRepository = new CardAssignmentRepository();
const checklistRepository = new ChecklistRepository();

router.post(
  "/",
  requireAuth,
  validateListAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listId = req.params.listId as string;
      const userId = req.userId!;
      const { title, description } = req.body;

      const card = await cardService.createCard(listId, userId, title, description);

      res.status(201).json({
        id: card.id,
        list_id: card.list_id,
        title: card.title,
        description: card.description,
        position: card.position,
        created_at: card.created_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "Título não pode estar vazio" ||
          error.message === "Título muito longo (máximo 255 caracteres)" ||
          error.message === "Descrição muito longa (máximo 5000 caracteres)"
        ) {
          next(new ValidationError(error.message));
        } else if (error.message === "Lista não encontrada") {
          next(new NotFoundError("Lista não encontrada"));
        } else if (error.message === "Acesso negado") {
          next(new ValidationError("Acesso negado"));
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
  validateListAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listId = req.params.listId as string;
      const userId = req.userId!;

      const cards = await cardService.getCardsByList(listId, userId);
      const cardIds = cards.map((c) => c.id);

      const [cardLabels, assignments, checklists] = await Promise.all([
        cardLabelRepository.findByCardIds(cardIds),
        cardAssignmentRepository.findByCardIds(cardIds),
        checklistRepository.findByCardIds(cardIds),
      ]);

      const cardsResponse = cards.map((card) => {
        const checklist = checklists.find((c) => c.card_id === card.id);
        const items = checklist?.items ?? [];

        return {
          id: card.id,
          title: card.title,
          description: card.description,
          position: card.position,
          labels: cardLabels
            .filter((cl) => cl.card_id === card.id)
            .map((cl) => ({ id: cl.label.id, name: cl.label.name, color: cl.label.color })),
          assignees: assignments
            .filter((a) => a.card_id === card.id)
            .map((a) => ({
              id: a.id,
              member_name: a.board_member.user?.email || "Convite pendente",
            })),
          checklist: checklist
            ? {
                total: items.length,
                completed: items.filter((i) => i.is_completed).length,
              }
            : null,
        };
      });

      res.status(200).json({
        cards: cardsResponse,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Lista não encontrada") {
          next(new NotFoundError("Lista não encontrada"));
        } else if (error.message === "Acesso negado") {
          next(new ValidationError("Acesso negado"));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

router.put(
  "/:cardId",
  requireAuth,
  validateListAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listId = req.params.listId as string;
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : undefined;
      const userId = req.userId!;

      if (!cardId) {
        next(new ValidationError("ID do cartão não fornecido"));
        return;
      }

      const { title, description, position, list_id, due_date } = req.body;

      let card;

      if (due_date !== undefined) {
        card = await cardService.setDueDate(
          req.params.boardId as string,
          cardId,
          listId,
          due_date,
          userId
        );
      } else if (position !== undefined || list_id !== undefined) {
        const toListId = list_id || listId;
        const finalPosition = position !== undefined ? position : 0;

        card = await cardService.moveCard(cardId, listId, userId, {
          toListId,
          position: finalPosition,
        });
      } else if (title !== undefined || description !== undefined) {
        card = await cardService.updateCard(cardId, listId, userId, {
          title,
          description,
        });
      } else {
        throw new Error("Title, description, position, list_id, or due_date required");
      }

      res.status(200).json({
        id: card.id,
        list_id: card.list_id,
        title: card.title,
        description: card.description,
        position: card.position,
        due_date: card.due_date,
        updated_at: card.updated_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "Título não pode estar vazio" ||
          error.message === "Título muito longo (máximo 255 caracteres)" ||
          error.message === "Descrição muito longa (máximo 5000 caracteres)" ||
          error.message === "Posição inválida" ||
          error.message === "Data inválida"
        ) {
          next(new ValidationError(error.message));
        } else if (
          error.message === "Cartão não encontrado" ||
          error.message === "Lista não encontrada" ||
          error.message === "Lista de origem não encontrada" ||
          error.message === "Lista de destino não encontrada" ||
          error.message === "Lista não pertence ao quadro"
        ) {
          next(new NotFoundError(error.message));
        } else if (error.message === "Acesso negado") {
          next(new ValidationError("Acesso negado"));
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
  "/:cardId",
  requireAuth,
  validateListAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listId = req.params.listId as string;
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : undefined;
      const userId = req.userId!;

      if (!cardId) {
        next(new ValidationError("ID do cartão não fornecido"));
        return;
      }

      await cardService.deleteCard(cardId, listId, userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "Cartão não encontrado" ||
          error.message === "Lista não encontrada"
        ) {
          next(new NotFoundError(error.message));
        } else if (error.message === "Acesso negado") {
          next(new ValidationError("Acesso negado"));
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
  "/:cardId/due-date",
  requireAuth,
  validateListAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = req.params.boardId as string;
      const listId = req.params.listId as string;
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : undefined;
      const userId = req.userId!;

      if (!cardId) {
        next(new ValidationError("ID do cartão não fornecido"));
        return;
      }

      await cardService.removeDueDate(boardId, cardId, listId, userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "Cartão não encontrado" ||
          error.message === "Lista não encontrada" ||
          error.message === "Lista não pertence ao quadro"
        ) {
          next(new NotFoundError(error.message));
        } else if (error.message === "Acesso negado") {
          next(new ValidationError("Acesso negado"));
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
