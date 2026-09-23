import type { NextFunction, Request, Response } from "express";
import {
  boardMemberIdSchema,
  inviteBoardMemberSchema,
  updateBoardMemberRoleSchema,
} from "../schemas/board-member.schema";
import { boardIdSchema } from "../schemas/board.schema";
import { boardMemberService } from "../services/BoardMemberService";
import { validate } from "../utils/validation";

function boardIdFrom(req: Request): string {
  return validate(boardIdSchema, req.params["boardId"]);
}

export class BoardMemberController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await boardMemberService.list(
        req.userId!,
        boardIdFrom(req),
      );

      res.status(200).json({ members });
    } catch (error) {
      next(error);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(inviteBoardMemberSchema, req.body);
      const member = await boardMemberService.invite(
        req.userId!,
        boardIdFrom(req),
        input,
      );

      res.status(201).json({ member });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const memberId = validate(boardMemberIdSchema, req.params["memberId"]);
      const input = validate(updateBoardMemberRoleSchema, req.body);
      const member = await boardMemberService.updateRole(
        req.userId!,
        boardIdFrom(req),
        memberId,
        input,
      );

      res.status(200).json({ member });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const memberId = validate(boardMemberIdSchema, req.params["memberId"]);
      await boardMemberService.remove(req.userId!, boardIdFrom(req), memberId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const boardMemberController = new BoardMemberController();
