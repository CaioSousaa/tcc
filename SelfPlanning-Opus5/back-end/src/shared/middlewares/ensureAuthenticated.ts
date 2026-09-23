import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { verifyAccessToken } from "../../modules/auth/services/tokenService";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export function ensureAuthenticated(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new AppError("Token de acesso não informado", 401);
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (token.length === 0) {
    throw new AppError("Token de acesso não informado", 401);
  }

  const payload = verifyAccessToken(token);

  request.user = { id: payload.sub, email: payload.email };

  next();
}
