import { Router } from "express";
import {
  createBoard,
  deleteBoard,
  getBoard,
  listBoards,
  updateBoard,
} from "../controllers/board.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const boardRouter = Router();

boardRouter.use(requireAuth);

boardRouter.get("/", listBoards);
boardRouter.post("/", createBoard);
boardRouter.get("/:id", getBoard);
boardRouter.patch("/:id", updateBoard);
boardRouter.delete("/:id", deleteBoard);
