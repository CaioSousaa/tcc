import type { CookieOptions, Response } from "express";
import { env } from "../config/env";

export const ACCESS_TOKEN_COOKIE = "kanbo_access_token";
export const REFRESH_TOKEN_COOKIE = "kanbo_refresh_token";
/** Readable by the browser so the Next.js proxy can do an optimistic route guard. */
export const SESSION_FLAG_COOKIE = "kanbo_session";

const REFRESH_TOKEN_PATH = "/";

function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: REFRESH_TOKEN_PATH,
  };
}

interface SessionCookieInput {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  /** When false the cookies are session-only and die with the browser. */
  rememberMe: boolean;
}

export function setSessionCookies(res: Response, input: SessionCookieInput) {
  const persistent = input.rememberMe
    ? { expires: input.refreshTokenExpiresAt }
    : {};

  res.cookie(ACCESS_TOKEN_COOKIE, input.accessToken, {
    ...baseOptions(),
    ...persistent,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, input.refreshToken, {
    ...baseOptions(),
    ...persistent,
  });

  res.cookie(SESSION_FLAG_COOKIE, "1", {
    ...baseOptions(),
    ...persistent,
    httpOnly: false,
  });
}

export function clearSessionCookies(res: Response) {
  const options = baseOptions();

  res.clearCookie(ACCESS_TOKEN_COOKIE, options);
  res.clearCookie(REFRESH_TOKEN_COOKIE, options);
  res.clearCookie(SESSION_FLAG_COOKIE, { ...options, httpOnly: false });
}
