import { Router } from "express";
import type { AuthController } from "../controllers/AuthController";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import { parseLoginInput, parseRegisterInput } from "../schemas/auth.schemas";
import type { AuthService } from "../services/AuthService";

export function authRoutes(controller: AuthController, authService: AuthService): Router {
  const router = Router();

  router.post("/register", validate(parseRegisterInput), controller.register);
  router.post("/login", validate(parseLoginInput), controller.login);
  router.post("/logout", controller.logout);
  router.get("/me", authenticate(authService), controller.me);

  return router;
}
