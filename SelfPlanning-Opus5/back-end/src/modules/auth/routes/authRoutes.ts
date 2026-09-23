import { Router } from "express";
import { ensureAuthenticated } from "../../../shared/middlewares/ensureAuthenticated";
import {
  login,
  me,
  refresh,
  register,
  signOut,
} from "../controllers/authController";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/refresh", refresh);
authRoutes.post("/logout", signOut);
authRoutes.get("/me", ensureAuthenticated, me);
