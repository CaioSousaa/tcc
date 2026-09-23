import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { CreateBoardInput, TodayQuery, UpdateBoardInput } from "../schemas/board.schemas";
import type { BoardService } from "../services/BoardService";

/** The account always comes from the session, never from the request (C30). */
function currentUserId(req: Request): string {
  if (!req.user) throw new AppError("UNAUTHENTICATED");
  return req.user.id;
}

function boardIdParam(req: Request): string {
  return String(req.params.boardId);
}

export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { today } = (res.locals.query ?? { today: null }) as TodayQuery;
    const boards = await this.boardService.list(currentUserId(req), today);
    res.status(200).json({ boards });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const board = await this.boardService.create(currentUserId(req), req.body as CreateBoardInput);
    res.status(201).json({ board });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const board = await this.boardService.get(currentUserId(req), boardIdParam(req));
    res.status(200).json({ board });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const board = await this.boardService.update(
      currentUserId(req),
      boardIdParam(req),
      req.body as UpdateBoardInput,
    );
    res.status(200).json({ board });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.boardService.delete(currentUserId(req), boardIdParam(req));
    res.status(204).end();
  };
}
