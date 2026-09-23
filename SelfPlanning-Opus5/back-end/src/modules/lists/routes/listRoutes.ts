import { Router } from "express";
import { create, destroy, index, move, rename } from "../controllers/listController";

export const listRoutes = Router({ mergeParams: true });

listRoutes.post("/", create);
listRoutes.get("/", index);
listRoutes.put("/:id", rename);
listRoutes.patch("/:id/position", move);
listRoutes.delete("/:id", destroy);
