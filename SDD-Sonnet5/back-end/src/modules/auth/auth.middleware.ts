import { NextFunction, Request, Response } from "express";
import { UnauthenticatedError } from "./auth.errors";
import { verifyAccessToken } from "./tokens";

const BEARER_PREFIX = "Bearer ";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(new UnauthenticatedError());
    return;
  }

  const token = header.slice(BEARER_PREFIX.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new UnauthenticatedError());
  }
}
