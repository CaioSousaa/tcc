import { Router } from "express";
import {
  assignCard,
  listAssignees,
  unassignCard,
} from "../controllers/card-assignee.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const cardAssigneeRouter = Router({ mergeParams: true });

cardAssigneeRouter.use(requireAuth);

cardAssigneeRouter.get("/", listAssignees);
cardAssigneeRouter.post("/", assignCard);
cardAssigneeRouter.delete("/:userId", unassignCard);
