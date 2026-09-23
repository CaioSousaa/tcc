import type { NextFunction, Request, Response } from "express";
import {
  boardIdSchema,
  createBoardSchema,
  updateBoardSchema,
} from "../schemas/board.schema";
import { boardService } from "../services/BoardService";
import { validate } from "../utils/validation";

export class BoardController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const boards = await boardService.list(req.userId!);

      res.status(200).json({ boards });
    } catch (error) {
      next(error);
    }
  }

  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const boardId = validate(boardIdSchema, req.params["id"]);
      const board = await boardService.findById(req.userId!, boardId);

      res.status(200).json({ board });
    } catch (error) {
      next(error);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(createBoardSchema, req.body);
      const board = await boardService.create(req.userId!, input);

      res.status(201).json({ board });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const boardId = validate(boardIdSchema, req.params["id"]);
      const input = validate(updateBoardSchema, req.body);
      const board = await boardService.update(req.userId!, boardId, input);

      res.status(200).json({ board });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const boardId = validate(boardIdSchema, req.params["id"]);
      await boardService.remove(req.userId!, boardId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const boardController = new BoardController();
