import { Router, Request, Response, NextFunction } from "express";
import { CardAssignmentRepository } from "../repositories/CardAssignmentRepository";
import { BoardMemberRepository } from "../repositories/BoardMemberRepository";
import { MemberService } from "../services/MemberService";
import { requireAuth } from "../middlewares";
import { ValidationError, NotFoundError, ForbiddenError } from "../types/errors";

const router = Router();
const assignmentRepository = new CardAssignmentRepository();
const boardMemberRepository = new BoardMemberRepository();
const memberService = new MemberService();

router.post(
  "/boards/:boardId/cards/:cardId/assignees",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const { board_member_id } = req.body;
      const userId = req.userId!;

      if (!board_member_id) {
        next(new ValidationError("ID do membro é obrigatório"));
        return;
      }

      const userRole = await memberService.getMemberRole(boardId, userId);
      if (userRole === null) {
        next(new ForbiddenError("Usuário não é membro deste quadro"));
        return;
      }

      if (userRole === "viewer") {
        next(new ForbiddenError("Apenas editores e administradores podem atribuir membros"));
        return;
      }

      const member = await boardMemberRepository.findById(board_member_id, boardId);
      if (!member) {
        next(new NotFoundError("Membro não encontrado"));
        return;
      }

      const existing = await assignmentRepository.findByCardAndMember(
        cardId,
        board_member_id
      );
      if (existing) {
        next(new ValidationError("Membro já está atribuído a este cartão"));
        return;
      }

      const assignment = await assignmentRepository.insert({
        card_id: cardId,
        board_member_id,
      });

      res.status(201).json({
        id: assignment.id,
        card_id: assignment.card_id,
        board_member_id: assignment.board_member_id,
        assigned_at: assignment.assigned_at,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/cards/:cardId/assignees",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";

      const assignments = await assignmentRepository.findByCardId(cardId);

      res.json({
        assignees: assignments.map((a) => ({
          id: a.id,
          member_id: a.board_member_id,
          member_name: a.board_member.user?.email || "Convite pendente",
          member_role: a.board_member.role,
          assigned_at: a.assigned_at,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/assignees/:assignmentId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assignmentId = typeof req.params.assignmentId === "string" ? req.params.assignmentId : "";
      const userId = req.userId!;

      const assignment = await assignmentRepository.findById(assignmentId);
      if (!assignment) {
        next(new NotFoundError("Atribuição não encontrada"));
        return;
      }

      const userRole = await memberService.getMemberRole(
        assignment.board_member.board_id,
        userId
      );
      if (userRole === "viewer") {
        next(new ForbiddenError("Apenas editores e administradores podem remover atribuições"));
        return;
      }

      await assignmentRepository.delete(assignmentId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
