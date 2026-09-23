import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options = {
    expiresIn: env.auth.accessTokenTtl,
  } as SignOptions;

  return jwt.sign(payload, env.auth.accessSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.auth.accessSecret);

  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Invalid access token payload");
  }

  return { sub: decoded.sub, email: String(decoded["email"] ?? "") };
}

/** Opaque refresh token: the raw value goes to the client, only its hash is stored. */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(48).toString("hex");

  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.auth.refreshTokenTtlDays);

  return expiresAt;
}
