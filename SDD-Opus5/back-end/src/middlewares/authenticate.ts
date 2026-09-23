import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError";
import type { AuthService } from "../services/AuthService";
import { SESSION_COOKIE_NAME } from "../utils/cookies";

/**
 * Single point where identity is resolved (N18). Validates the session on every
 * request (RN12) and never trusts identifiers sent by the client (RN13).
 */
export function authenticate(authService: AuthService): RequestHandler {
  return async (req, _res, next) => {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const raw = cookies?.[SESSION_COOKIE_NAME];
    const session = await authService.resolveSession(typeof raw === "string" ? raw : undefined);

    if (session.status === "valid") {
      req.user = session.user;
      next();
      return;
    }

    next(new AppError(session.status === "expired" ? "SESSION_EXPIRED" : "UNAUTHENTICATED"));
  };
}
