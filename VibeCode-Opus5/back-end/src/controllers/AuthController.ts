import type { NextFunction, Request, Response } from "express";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { authService, type Session } from "../services/AuthService";
import { AppError } from "../utils/AppError";
import {
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from "../utils/cookies";
import { validate } from "../utils/validation";

function respondWithSession(res: Response, session: Session, statusCode = 200) {
  setSessionCookies(res, {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    refreshTokenExpiresAt: session.refreshTokenExpiresAt,
    rememberMe: session.persistent,
  });

  res.status(statusCode).json({ user: session.user });
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(registerSchema, req.body);
      const session = await authService.register(input);

      respondWithSession(res, session, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(loginSchema, req.body);
      const session = await authService.login(input);

      respondWithSession(res, session);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

      if (!rawRefreshToken) {
        throw new AppError("Sessão expirada. Faça login novamente.", 401);
      }

      const session = await authService.refresh(rawRefreshToken);

      respondWithSession(res, session);
    } catch (error) {
      clearSessionCookies(res);
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.cookies?.[REFRESH_TOKEN_COOKIE]);
      clearSessionCookies(res);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.userId!);

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
