import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError";
import { isUuid } from "../schemas/board.schemas";

/**
 * A malformed id is answered exactly like a missing board (CA22), before any
 * query reaches the database (N30).
 */
export const validateBoardId: RequestHandler = (req, _res, next) => {
  if (!isUuid(req.params.boardId)) {
    next(new AppError("BOARD_NOT_FOUND"));
    return;
  }
  next();
};
