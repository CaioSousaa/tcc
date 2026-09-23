import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import {
  requireEmail,
  requireName,
  requirePassword,
  requireString,
} from "../../../shared/validation/validators";
import { userRepository } from "../../users/repositories/userRepository";
import { toUserView } from "../../users/userView";
import {
  authenticateUser,
  logout,
  refreshSession,
  registerUser,
} from "../services/authService";

export async function register(request: Request, response: Response): Promise<void> {
  const user = await registerUser({
    name: requireName(request.body?.name),
    email: requireEmail(request.body?.email),
    password: requirePassword(request.body?.password),
  });

  response.status(201).json({ user });
}

export async function login(request: Request, response: Response): Promise<void> {
  const session = await authenticateUser({
    email: requireEmail(request.body?.email),
    password: requireString(request.body?.password, "senha"),
  });

  response.status(200).json(session);
}

export async function refresh(request: Request, response: Response): Promise<void> {
  const token = requireString(request.body?.refreshToken, "refreshToken");

  const session = await refreshSession(token);

  response.status(200).json(session);
}

export async function signOut(request: Request, response: Response): Promise<void> {
  const token = requireString(request.body?.refreshToken, "refreshToken");

  await logout(token);

  response.status(204).send();
}

export async function me(request: Request, response: Response): Promise<void> {
  const authenticated = request.user;

  if (!authenticated) {
    throw new AppError("Token de acesso não informado", 401);
  }

  const user = await userRepository().findOne({ where: { id: authenticated.id } });

  if (!user) {
    throw new AppError("Sessão expirada ou inválida", 401);
  }

  response.status(200).json({ user: toUserView(user) });
}
