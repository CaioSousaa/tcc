import type { CookieOptions, Response } from "express";
import type { SessionKind } from "../services/TokenService";

export const SESSION_COOKIE_NAME = "session_token";

export type SessionCookieConfig = {
  secure: boolean;
  persistentMaxAgeMs: number;
};

function baseOptions(config: SessionCookieConfig): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.secure,
    path: "/",
  };
}

/**
 * A persistent session gets Max-Age; a short session gets none, which makes it
 * a browser-session cookie that is dropped when the browser closes (A11).
 */
export function sessionCookieOptions(kind: SessionKind, config: SessionCookieConfig): CookieOptions {
  const options = baseOptions(config);
  if (kind === "persistent") options.maxAge = config.persistentMaxAgeMs;
  return options;
}

export function setSessionCookie(
  res: Response,
  token: string,
  kind: SessionKind,
  config: SessionCookieConfig,
): void {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(kind, config));
}

export function clearSessionCookie(res: Response, config: SessionCookieConfig): void {
  res.clearCookie(SESSION_COOKIE_NAME, baseOptions(config));
}
