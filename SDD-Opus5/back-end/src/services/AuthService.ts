import { randomUUID } from "node:crypto";
import { AppError, UniqueConstraintError } from "../errors/AppError";
import type { StoredUser, UserRepository } from "../repositories/UserRepository";
import type { LoginInput, RegisterInput } from "../schemas/auth.schemas";
import type { PasswordService } from "./PasswordService";
import type { SessionKind, TokenService } from "./TokenService";

export type PublicUser = { id: string; name: string; email: string };

export type AuthResult = {
  user: PublicUser;
  token: string;
  sessionKind: SessionKind;
};

export type SessionResolution =
  | { status: "valid"; user: PublicUser }
  | { status: "expired" }
  | { status: "invalid" };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Single serializer for account data leaving the service (C14, RN07). */
export function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Creates the account and a persistent session (RN10). The token is signed
   * before the insert, so a signing failure leaves nothing persisted (RN15).
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    // Friendly pre-check; the unique index is the real guarantee (D1, CB09).
    if (await this.users.existsByEmail(input.email)) {
      throw new AppError("EMAIL_ALREADY_EXISTS");
    }

    const id = randomUUID();
    const sessionKind: SessionKind = "persistent";
    const passwordHash = await this.passwords.hash(input.password);
    const token = this.tokens.sign(id, sessionKind);

    try {
      const user = await this.users.create({ id, name: input.name, email: input.email, passwordHash });
      return { user: toPublicUser(user), token, sessionKind };
    } catch (error) {
      if (error instanceof UniqueConstraintError) throw new AppError("EMAIL_ALREADY_EXISTS");
      throw error;
    }
  }

  /** Unknown e-mail and wrong password are indistinguishable to the caller (RN08). */
  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(input.email);

    if (!user) {
      await this.passwords.verifyAgainstDummy(input.password);
      throw new AppError("INVALID_CREDENTIALS");
    }

    const matches = await this.passwords.verify(input.password, user.passwordHash);
    if (!matches) throw new AppError("INVALID_CREDENTIALS");

    const sessionKind: SessionKind = input.rememberMe ? "persistent" : "short";
    return {
      user: toPublicUser(user),
      token: this.tokens.sign(user.id, sessionKind),
      sessionKind,
    };
  }

  async resolveSession(token: string | undefined): Promise<SessionResolution> {
    if (!token) return { status: "invalid" };

    const verification = this.tokens.verify(token);
    if (verification.status !== "valid") return verification;
    if (!UUID_PATTERN.test(verification.userId)) return { status: "invalid" };

    const user = await this.users.findById(verification.userId);
    if (!user) return { status: "invalid" };

    return { status: "valid", user: toPublicUser(user) };
  }
}
