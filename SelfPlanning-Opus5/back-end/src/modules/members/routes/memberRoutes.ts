import { Router } from "express";
import { destroy, index, invite, updateRole } from "../controllers/memberController";

export const memberRoutes = Router({ mergeParams: true });

memberRoutes.post("/", invite);
memberRoutes.get("/", index);
memberRoutes.patch("/:memberId/role", updateRole);
memberRoutes.delete("/:memberId", destroy);
