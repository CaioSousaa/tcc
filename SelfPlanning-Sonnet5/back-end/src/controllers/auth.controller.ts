import { Request, Response } from "express";
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  findUserById,
  login,
  logout,
  refresh,
  register,
} from "../services/auth.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toUserResponse(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "Nome é obrigatório" });
    return;
  }
  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ message: "E-mail inválido" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ message: "Senha deve ter no mínimo 8 caracteres" });
    return;
  }

  try {
    const user = await register(name.trim(), email.toLowerCase().trim(), password);
    res.status(201).json(toUserResponse(user));
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      res.status(409).json({ message: "E-mail já cadastrado" });
      return;
    }
    throw error;
  }
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password, rememberMe } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ message: "E-mail e senha são obrigatórios" });
    return;
  }

  try {
    const { user, tokens } = await login(
      email.toLowerCase().trim(),
      password,
      Boolean(rememberMe)
    );
    res.status(200).json({ user: toUserResponse(user), ...tokens });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ message: "Credenciais inválidas" });
      return;
    }
    throw error;
  }
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body ?? {};

  if (typeof refreshToken !== "string" || !refreshToken) {
    res.status(400).json({ message: "Refresh token é obrigatório" });
    return;
  }

  try {
    const tokens = await refresh(refreshToken);
    res.status(200).json(tokens);
  } catch (error) {
    if (error instanceof InvalidRefreshTokenError) {
      res.status(401).json({ message: "Refresh token inválido ou expirado" });
      return;
    }
    throw error;
  }
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body ?? {};

  if (typeof refreshToken === "string" && refreshToken) {
    await logout(refreshToken);
  }

  res.status(204).send();
}

export async function meHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await findUserById(req.userId as string);

  if (!user) {
    res.status(404).json({ message: "Usuário não encontrado" });
    return;
  }

  res.status(200).json(toUserResponse(user));
}
