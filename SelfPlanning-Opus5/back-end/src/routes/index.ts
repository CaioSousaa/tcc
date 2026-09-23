import { Router } from "express";
import { authRoutes } from "../modules/auth/routes/authRoutes";
import { boardRoutes } from "../modules/boards/routes/boardRoutes";

export const routes = Router();

routes.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

routes.use("/auth", authRoutes);
routes.use("/boards", boardRoutes);
