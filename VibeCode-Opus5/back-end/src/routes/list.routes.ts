import { Router } from "express";
import { listController } from "../controllers/ListController";

/** Mounted under /boards/:boardId/lists, so board params must be inherited. */
export const listRoutes = Router({ mergeParams: true });

listRoutes.get("/", (req, res, next) => listController.index(req, res, next));
listRoutes.post("/", (req, res, next) => listController.store(req, res, next));
listRoutes.patch("/reorder", (req, res, next) =>
  listController.reorder(req, res, next),
);
listRoutes.patch("/:listId", (req, res, next) =>
  listController.update(req, res, next),
);
listRoutes.delete("/:listId", (req, res, next) =>
  listController.destroy(req, res, next),
);
