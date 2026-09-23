import { Router } from "express";
import {
  createBoardHandler,
  deleteBoardHandler,
  getBoardHandler,
  listBoardsHandler,
  updateBoardHandler,
} from "../controllers/board.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const boardRoutes = Router();

boardRoutes.use(authMiddleware);

boardRoutes.post("/", createBoardHandler);
boardRoutes.get("/", listBoardsHandler);
boardRoutes.get("/:id", getBoardHandler);
boardRoutes.patch("/:id", updateBoardHandler);
boardRoutes.delete("/:id", deleteBoardHandler);
