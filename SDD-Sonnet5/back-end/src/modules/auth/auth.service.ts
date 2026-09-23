import { env } from "../../config/env";
import { LoginInput, RegisterInput } from "./auth.schemas";
import { EmailAlreadyInUseError, InvalidCredentialsError, InvalidSessionError } from "./auth.errors";
import { User } from "./entities/user.entity";
import { hashPassword, verifyPassword } from "./password";
import { RefreshTokenRepository, UserRepository } from "./repositories/repository.types";
import { generateRefreshToken, hashRefreshToken, signAccessToken } from "./tokens";

export interface AuthResult {
  user: { id: string; name: string; email: string };
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.toLowerCase();
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyInUseError();
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.create({ name: input.name, email, passwordHash });

    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.toLowerCase();
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return this.issueSession(user);
  }

  async refresh(rawRefreshToken: string | undefined): Promise<AuthResult> {
    if (!rawRefreshToken) {
      throw new InvalidSessionError();
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    const isExpired = !stored || stored.expiresAt.getTime() <= Date.now();
    const isRevoked = !stored || stored.revokedAt !== null;
    if (!stored || isExpired || isRevoked) {
      throw new InvalidSessionError();
    }

    await this.refreshTokenRepository.revoke(stored.id);
    return this.issueSession(stored.user);
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!stored || stored.revokedAt !== null) {
      return;
    }

    await this.refreshTokenRepository.revoke(stored.id);
  }

  private async issueSession(user: User): Promise<AuthResult> {
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const { token: refreshToken, hash: tokenHash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + env.refreshTokenExpiresInSeconds * 1000);

    await this.refreshTokenRepository.create({ userId: user.id, tokenHash, expiresAt });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
    };
  }
}
