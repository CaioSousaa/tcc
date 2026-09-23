import { IsNull, MoreThan } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";
import { hashPassword, comparePassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
} from "../utils/refreshToken";

const userRepository = () => AppDataSource.getRepository(User);
const refreshTokenRepository = () => AppDataSource.getRepository(RefreshToken);

export class EmailAlreadyInUseError extends Error {}
export class InvalidCredentialsError extends Error {}
export class InvalidRefreshTokenError extends Error {}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

async function issueTokens(userId: string, rememberMe: boolean): Promise<AuthTokens> {
  const accessToken = signAccessToken(userId);
  const refreshToken = generateRefreshToken();

  await refreshTokenRepository().save(
    refreshTokenRepository().create({
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiresAt(rememberMe),
      revokedAt: null,
    })
  );

  return { accessToken, refreshToken };
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const existing = await userRepository().findOne({ where: { email } });
  if (existing) {
    throw new EmailAlreadyInUseError();
  }

  const passwordHash = await hashPassword(password);
  const user = userRepository().create({ name, email, passwordHash });
  return userRepository().save(user);
}

export async function login(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<{ user: User; tokens: AuthTokens }> {
  const user = await userRepository().findOne({ where: { email } });
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }

  const tokens = await issueTokens(user.id, rememberMe);
  return { user, tokens };
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await refreshTokenRepository().findOne({
    where: { tokenHash, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
  });

  if (!stored) {
    throw new InvalidRefreshTokenError();
  }

  stored.revokedAt = new Date();
  await refreshTokenRepository().save(stored);

  const wasLongLived =
    stored.expiresAt.getTime() - stored.createdAt.getTime() > 7 * 24 * 60 * 60 * 1000;

  return issueTokens(stored.userId, wasLongLived);
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await refreshTokenRepository().findOne({ where: { tokenHash } });

  if (stored && !stored.revokedAt) {
    stored.revokedAt = new Date();
    await refreshTokenRepository().save(stored);
  }
}

export async function findUserById(id: string): Promise<User | null> {
  return userRepository().findOne({ where: { id } });
}
