import { Router } from "express";
import { assign, index, unassign } from "../controllers/assigneeController";

export const assigneeRoutes = Router({ mergeParams: true });

assigneeRoutes.get("/", index);
assigneeRoutes.post("/", assign);
assigneeRoutes.delete("/:memberId", unassign);
