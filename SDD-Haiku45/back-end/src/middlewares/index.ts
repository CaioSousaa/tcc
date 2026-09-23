import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/errors";
import { SessionService } from "../services/SessionService";
import { BoardRepository } from "../repositories/BoardRepository";
import { ColumnRepository } from "../repositories/ColumnRepository";
import { BoardMemberRepository } from "../repositories/BoardMemberRepository";
import { MemberService } from "../services/MemberService";
import { MemberStatus } from "../entities/BoardMember";

const sessionService = new SessionService();
const boardRepository = new BoardRepository();
const boardMemberRepository = new BoardMemberRepository();
const columnRepository = new ColumnRepository();
const memberService = new MemberService();

declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      userId?: string;
      boardId?: string;
    }
  }
}

export const parseCookie = (req: Request, res: Response, next: NextFunction) => {
  const cookies = req.headers.cookie || "";
  const sessionMatch = cookies.match(/sessionId=([^;]*)/);
  if (sessionMatch && sessionMatch[1]) {
    req.sessionId = sessionMatch[1];
  }
  next();
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.sessionId) {
      throw new AppError(401, "unauthorized", "Sessão não encontrada");
    }

    const session = await sessionService.validateSession(req.sessionId);
    if (!session) {
      throw new AppError(401, "unauthorized", "Sessão expirada");
    }

    req.userId = session.user_id;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateBoardAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, "unauthorized", "Usuário não autenticado");
    }

    const boardId = typeof req.params.boardId === "string" ? req.params.boardId : undefined;
    if (!boardId) {
      throw new AppError(400, "validation", "ID do quadro não fornecido");
    }

    const board = await boardRepository.findByIdOnly(boardId);
    if (!board) {
      throw new AppError(404, "not_found", "Quadro não encontrado");
    }

    if (board.user_id !== req.userId) {
      throw new AppError(403, "forbidden", "Você não tem permissão para acessar este quadro");
    }

    req.boardId = boardId;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateListAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listId = typeof req.params.listId === "string" ? req.params.listId : undefined;
    if (!listId) {
      throw new AppError(400, "validation", "ID da lista não fornecido");
    }

    const list = await columnRepository.findByIdOnly(listId);
    if (!list) {
      throw new AppError(404, "not_found", "Lista não encontrada");
    }

    req.params.boardId = list.board_id;
    return validateBoardAccess(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        throw new AppError(401, "unauthorized", "Usuário não autenticado");
      }

      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : undefined;
      if (!boardId) {
        throw new AppError(400, "validation", "ID do quadro não fornecido");
      }

      const userRole = await memberService.getMemberRole(boardId, req.userId);
      if (!userRole || !allowedRoles.includes(userRole)) {
        throw new AppError(403, "forbidden", "Você não tem permissão para realizar esta ação");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireMemberActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, "unauthorized", "Usuário não autenticado");
    }

    const boardId = typeof req.params.boardId === "string" ? req.params.boardId : undefined;
    if (!boardId) {
      throw new AppError(400, "validation", "ID do quadro não fornecido");
    }

    const member = await boardMemberRepository.findByUserAndBoard(req.userId, boardId);
    if (!member || member.status !== MemberStatus.ACTIVE) {
      throw new AppError(403, "forbidden", "Você não é um membro ativo deste quadro");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
    });
  }

  console.error(err);
  res.status(500).json({
    error: "internal_error",
    message: "Erro interno do servidor",
  });
};
