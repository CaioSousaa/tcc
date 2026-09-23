import { NextFunction, Request, RequestHandler, Response } from "express";
import { env } from "../../config/env";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema, formatZodError } from "./auth.schemas";
import { UnauthenticatedError, ValidationError } from "./auth.errors";

export const REFRESH_COOKIE_NAME = "refresh_token";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
}

function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    path: "/auth",
    expires: expiresAt,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/auth" });
}

export function buildAuthController(service: AuthService) {
  const register = asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const result = await service.register(parsed.data);
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(201).json({ user: result.user, accessToken: result.accessToken });
  });

  const login = asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const result = await service.login(parsed.data);
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(200).json({ user: result.user, accessToken: result.accessToken });
  });

  const refresh = asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const result = await service.refresh(rawToken);
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(200).json({ accessToken: result.accessToken });
  });

  const logout = asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await service.logout(rawToken);
    clearRefreshCookie(res);
    res.status(204).send();
  });

  const me = asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new UnauthenticatedError();
    }
    res.status(200).json(req.user);
  });

  return { register, login, refresh, logout, me };
}
