import bcrypt from "bcryptjs";
import { AppError } from "../../../shared/errors/AppError";
import { activatePendingInvites } from "../../members/services/memberService";
import { userRepository } from "../../users/repositories/userRepository";
import { UserView, toUserView } from "../../users/userView";
import {
  TokenPair,
  findValidRefreshToken,
  issueTokenPair,
  revokeRefreshToken,
} from "./tokenService";

const PASSWORD_SALT_ROUNDS = 10;
const INVALID_CREDENTIALS = "E-mail ou senha inválidos";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthenticatedSession extends TokenPair {
  user: UserView;
}

export async function registerUser(data: RegisterRequest): Promise<UserView> {
  const repository = userRepository();

  const alreadyExists = await repository.findOne({ where: { email: data.email } });

  if (alreadyExists) {
    throw new AppError("Este e-mail já está cadastrado", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, PASSWORD_SALT_ROUNDS);

  const user = repository.create({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  await repository.save(user);

  await activatePendingInvites(user);

  return toUserView(user);
}

export async function authenticateUser(data: LoginRequest): Promise<AuthenticatedSession> {
  const user = await userRepository().findOne({ where: { email: data.email } });

  if (!user) {
    throw new AppError(INVALID_CREDENTIALS, 401);
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(INVALID_CREDENTIALS, 401);
  }

  const tokens = await issueTokenPair(user);

  return { user: toUserView(user), ...tokens };
}

export async function refreshSession(token: string): Promise<AuthenticatedSession> {
  const stored = await findValidRefreshToken(token);

  await revokeRefreshToken(token);

  const tokens = await issueTokenPair(stored.user);

  return { user: toUserView(stored.user), ...tokens };
}

export async function logout(token: string): Promise<void> {
  await revokeRefreshToken(token);
}
