import { randomBytes, createHash } from "crypto";

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REMEMBER_ME_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiresAt(rememberMe: boolean): Date {
  const ttl = rememberMe ? REMEMBER_ME_TTL_MS : DEFAULT_TTL_MS;
  return new Date(Date.now() + ttl);
}
