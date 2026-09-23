import crypto from "crypto";

export const REFRESH_TOKEN_COOKIE = "refreshToken";
export const REFRESH_TOKEN_TTL_DEFAULT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const REFRESH_TOKEN_TTL_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenTtlMs(rememberMe: boolean): number {
  return rememberMe
    ? REFRESH_TOKEN_TTL_REMEMBER_MS
    : REFRESH_TOKEN_TTL_DEFAULT_MS;
}
