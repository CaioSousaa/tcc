import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "./auth.middleware";
import { buildAuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

export function buildAuthRouter(service: AuthService): Router {
  const router = Router();
  const controller = buildAuthController(service);

  router.post("/register", authRateLimiter, controller.register);
  router.post("/login", authRateLimiter, controller.login);
  router.post("/refresh", controller.refresh);
  router.post("/logout", controller.logout);
  router.get("/me", authenticate, controller.me);

  return router;
}
