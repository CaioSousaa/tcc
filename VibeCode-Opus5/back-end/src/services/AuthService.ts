import { LessThan } from "typeorm";
import { AppDataSource } from "../data-source";
import { RefreshToken } from "../entities/RefreshToken";
import { User } from "../entities/User";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";
import { AppError } from "../utils/AppError";
import { hashPassword, verifyPassword } from "../utils/password";
import { boardMemberService } from "./BoardMemberService";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
  signAccessToken,
} from "../utils/tokens";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Session {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  /** Mirrors the "manter-me conectado" choice made when the session started. */
  persistent: boolean;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export class AuthService {
  private get users() {
    return AppDataSource.getRepository(User);
  }

  private get refreshTokens() {
    return AppDataSource.getRepository(RefreshToken);
  }

  async register(input: RegisterInput): Promise<Session> {
    const existing = await this.users.findOne({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError("Este e-mail já está cadastrado.", 409, {
        email: "Este e-mail já está cadastrado.",
      });
    }

    const user = this.users.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    });

    await this.users.save(user);
    await boardMemberService.activatePendingInvites(user.id, user.email);

    return this.createSession(user, input.rememberMe ?? true);
  }

  async login(input: LoginInput): Promise<Session> {
    const user = await this.users.findOne({ where: { email: input.email } });
    const passwordMatches = user
      ? await verifyPassword(input.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw new AppError("E-mail ou senha inválidos.", 401);
    }

    return this.createSession(user, input.rememberMe ?? false);
  }

  /** Rotates the refresh token: the presented one is revoked and a new one issued. */
  async refresh(rawRefreshToken: string): Promise<Session> {
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: hashRefreshToken(rawRefreshToken) },
      relations: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
      throw new AppError("Sessão expirada. Faça login novamente.", 401);
    }

    stored.revokedAt = new Date();
    await this.refreshTokens.save(stored);

    return this.createSession(stored.user, stored.persistent);
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    await this.refreshTokens.update(
      { tokenHash: hashRefreshToken(rawRefreshToken) },
      { revokedAt: new Date() },
    );
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.users.findOne({ where: { id: userId } });

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    return toPublicUser(user);
  }

  private async createSession(user: User, persistent: boolean): Promise<Session> {
    const { token, tokenHash } = generateRefreshToken();
    const expiresAt = refreshTokenExpiresAt();

    await this.refreshTokens.delete({ expiresAt: LessThan(new Date()) });

    await this.refreshTokens.save(
      this.refreshTokens.create({
        tokenHash,
        userId: user.id,
        expiresAt,
        persistent,
        revokedAt: null,
      }),
    );

    return {
      user: toPublicUser(user),
      accessToken: signAccessToken({ sub: user.id, email: user.email }),
      refreshToken: token,
      refreshTokenExpiresAt: expiresAt,
      persistent,
    };
  }
}

export const authService = new AuthService();
