import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { ACCESS_TOKEN_COOKIE } from "../utils/cookies";
import { verifyAccessToken } from "../utils/tokens";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : undefined;
  const token = bearerToken ?? req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token) {
    return next(new AppError("Não autenticado.", 401));
  }

  try {
    req.userId = verifyAccessToken(token).sub;
    next();
  } catch {
    next(new AppError("Sessão expirada. Faça login novamente.", 401));
  }
}
