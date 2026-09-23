import { CookieOptions, Request, Response } from "express";
import { AppDataSource } from "../utils/data-source";
import { User } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";
import { comparePassword, hashPassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";
import {
  REFRESH_TOKEN_COOKIE,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenTtlMs,
} from "../utils/refresh-token";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function cookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: maxAgeMs,
  };
}

function toUserResponse(user: User) {
  return { id: user.id, name: user.name, email: user.email };
}

async function issueSession(
  res: Response,
  user: User,
  rememberMe: boolean,
): Promise<string> {
  const refreshRepository = AppDataSource.getRepository(RefreshToken);

  const rawRefreshToken = generateRefreshToken();
  const ttlMs = refreshTokenTtlMs(rememberMe);

  const refreshToken = refreshRepository.create({
    tokenHash: hashRefreshToken(rawRefreshToken),
    userId: user.id,
    rememberMe,
    expiresAt: new Date(Date.now() + ttlMs),
    revokedAt: null,
  });
  await refreshRepository.save(refreshToken);

  res.cookie(REFRESH_TOKEN_COOKIE, rawRefreshToken, cookieOptions(ttlMs));

  return signAccessToken(user.id);
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
    return;
  }

  if (!EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: "E-mail inválido." });
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    res
      .status(400)
      .json({ error: `Senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.` });
    return;
  }

  const userRepository = AppDataSource.getRepository(User);
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await userRepository.findOne({
    where: { email: normalizedEmail },
  });
  if (existing) {
    res.status(409).json({ error: "Já existe uma conta com este e-mail." });
    return;
  }

  const user = userRepository.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
  });
  await userRepository.save(user);

  const accessToken = await issueSession(res, user, false);

  res.status(201).json({ user: toUserResponse(user), accessToken });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password, rememberMe } = req.body as {
    email?: string;
    password?: string;
    rememberMe?: boolean;
  };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    return;
  }

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { email: email.trim().toLowerCase() },
  });

  const passwordMatches = user
    ? await comparePassword(password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    res.status(401).json({ error: "E-mail ou senha inválidos." });
    return;
  }

  const accessToken = await issueSession(res, user, Boolean(rememberMe));

  res.status(200).json({ user: toUserResponse(user), accessToken });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
    | string
    | undefined;

  if (!rawRefreshToken) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  const refreshRepository = AppDataSource.getRepository(RefreshToken);
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const existing = await refreshRepository.findOne({
    where: { tokenHash },
    relations: { user: true },
  });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/api/auth" });
    res.status(401).json({ error: "Sessão inválida ou expirada." });
    return;
  }

  existing.revokedAt = new Date();
  await refreshRepository.save(existing);

  const accessToken = await issueSession(
    res,
    existing.user,
    existing.rememberMe,
  );

  res.status(200).json({ user: toUserResponse(existing.user), accessToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
    | string
    | undefined;

  if (rawRefreshToken) {
    const refreshRepository = AppDataSource.getRepository(RefreshToken);
    const tokenHash = hashRefreshToken(rawRefreshToken);
    await refreshRepository.update({ tokenHash }, { revokedAt: new Date() });
  }

  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/api/auth" });
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { id: req.userId as string },
  });

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }

  res.status(200).json({ user: toUserResponse(user) });
}
