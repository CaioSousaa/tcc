import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresInSeconds,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwtAccessSecret);
  if (typeof decoded === "string" || !decoded.sub || typeof decoded["email"] !== "string") {
    throw new Error("Malformed access token payload");
  }
  return { sub: decoded.sub, email: decoded["email"] };
}

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(64).toString("hex");
  return { token, hash: hashRefreshToken(token) };
}
