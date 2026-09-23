import { Router } from "express";
import {
  addAssigneeHandler,
  listAssigneesHandler,
  removeAssigneeHandler,
} from "../controllers/card-assignee.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const cardAssigneeRoutes = Router({ mergeParams: true });

cardAssigneeRoutes.use(authMiddleware);

cardAssigneeRoutes.post("/", addAssigneeHandler);
cardAssigneeRoutes.get("/", listAssigneesHandler);
cardAssigneeRoutes.delete("/:userId", removeAssigneeHandler);
