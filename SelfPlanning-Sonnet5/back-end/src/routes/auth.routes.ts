import { Router } from "express";
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const authRoutes = Router();

authRoutes.post("/register", registerHandler);
authRoutes.post("/login", loginHandler);
authRoutes.post("/refresh", refreshHandler);
authRoutes.post("/logout", logoutHandler);
authRoutes.get("/me", authMiddleware, meHandler);
