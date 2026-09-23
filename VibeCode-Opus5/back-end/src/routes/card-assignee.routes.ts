import { Router } from "express";
import { cardAssigneeController } from "../controllers/CardAssigneeController";

/** Mounted under /boards/:boardId/card-assignees, so board params must be inherited. */
export const cardAssigneeRoutes = Router({ mergeParams: true });

cardAssigneeRoutes.get("/", (req, res, next) =>
  cardAssigneeController.index(req, res, next),
);
cardAssigneeRoutes.post("/", (req, res, next) =>
  cardAssigneeController.store(req, res, next),
);
cardAssigneeRoutes.delete("/:assigneeId", (req, res, next) =>
  cardAssigneeController.destroy(req, res, next),
);
