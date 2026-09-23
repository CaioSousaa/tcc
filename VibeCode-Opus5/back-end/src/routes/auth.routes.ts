import { Router } from "express";
import { authController } from "../controllers/AuthController";
import { authenticate } from "../middlewares/authenticate";

export const authRoutes = Router();

authRoutes.post("/register", (req, res, next) =>
  authController.register(req, res, next),
);
authRoutes.post("/login", (req, res, next) =>
  authController.login(req, res, next),
);
authRoutes.post("/refresh", (req, res, next) =>
  authController.refresh(req, res, next),
);
authRoutes.post("/logout", (req, res, next) =>
  authController.logout(req, res, next),
);
authRoutes.get("/me", authenticate, (req, res, next) =>
  authController.me(req, res, next),
);
