import { Router } from "express";
import { ensureAuthenticated } from "../../../shared/middlewares/ensureAuthenticated";
import { create, destroy, index, show, update } from "../controllers/boardController";
import { listRoutes } from "../../lists/routes/listRoutes";
import { cardRoutes } from "../../cards/routes/cardRoutes";
import { memberRoutes } from "../../members/routes/memberRoutes";
import { labelRoutes } from "../../labels/routes/labelRoutes";

export const boardRoutes = Router();

boardRoutes.use(ensureAuthenticated);

boardRoutes.post("/", create);
boardRoutes.get("/", index);
boardRoutes.get("/:id", show);
boardRoutes.put("/:id", update);
boardRoutes.delete("/:id", destroy);

boardRoutes.use("/:boardId/lists", listRoutes);
boardRoutes.use("/:boardId/cards", cardRoutes);
boardRoutes.use("/:boardId/members", memberRoutes);
boardRoutes.use("/:boardId/labels", labelRoutes);
