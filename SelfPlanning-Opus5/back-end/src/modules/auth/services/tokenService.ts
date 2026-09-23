import crypto from "node:crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { Repository } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { env } from "../../../config/env";
import { AppError } from "../../../shared/errors/AppError";
import { User } from "../../users/entities/User";
import { RefreshToken } from "../entities/RefreshToken";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function refreshTokenRepository(): Repository<RefreshToken> {
  return AppDataSource.getRepository(RefreshToken);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateAccessToken(user: User): string {
  const payload: AccessTokenPayload = { sub: user.id, email: user.email };
  const options: SignOptions = {
    expiresIn: env.jwt.accessExpiresIn as NonNullable<SignOptions["expiresIn"]>,
  };

  return jwt.sign(payload, env.jwt.accessSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;

    return decoded;
  } catch {
    throw new AppError("Sessão expirada ou inválida", 401);
  }
}

export async function issueRefreshToken(user: User): Promise<string> {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.jwt.refreshExpiresInDays);

  const repository = refreshTokenRepository();

  const refreshToken = repository.create({
    tokenHash: hashToken(token),
    userId: user.id,
    expiresAt,
    revokedAt: null,
  });

  await repository.save(refreshToken);

  return token;
}

export async function issueTokenPair(user: User): Promise<TokenPair> {
  const accessToken = generateAccessToken(user);
  const refreshToken = await issueRefreshToken(user);

  return { accessToken, refreshToken };
}

export async function findValidRefreshToken(token: string): Promise<RefreshToken> {
  const stored = await refreshTokenRepository().findOne({
    where: { tokenHash: hashToken(token) },
    relations: { user: true },
  });

  if (!stored || stored.revokedAt !== null || stored.expiresAt.getTime() <= Date.now()) {
    throw new AppError("Sessão expirada ou inválida", 401);
  }

  return stored;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const repository = refreshTokenRepository();

  const stored = await repository.findOne({ where: { tokenHash: hashToken(token) } });

  if (!stored || stored.revokedAt !== null) {
    return;
  }

  stored.revokedAt = new Date();

  await repository.save(stored);
}
