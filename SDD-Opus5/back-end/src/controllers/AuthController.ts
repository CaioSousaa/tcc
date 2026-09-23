import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { LoginInput, RegisterInput } from "../schemas/auth.schemas";
import type { AuthService } from "../services/AuthService";
import { clearSessionCookie, setSessionCookie, type SessionCookieConfig } from "../utils/cookies";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieConfig: SessionCookieConfig,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body as RegisterInput);
    setSessionCookie(res, result.token, result.sessionKind, this.cookieConfig);
    res.status(201).json({ user: result.user });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body as LoginInput);
    setSessionCookie(res, result.token, result.sessionKind, this.cookieConfig);
    res.status(200).json({ user: result.user });
  };

  /** Idempotent: works with a missing, invalid or expired cookie (CB13). */
  logout = (_req: Request, res: Response): void => {
    clearSessionCookie(res, this.cookieConfig);
    res.status(204).end();
  };

  me = (req: Request, res: Response): void => {
    if (!req.user) throw new AppError("UNAUTHENTICATED");
    res.status(200).json({ user: req.user });
  };
}
