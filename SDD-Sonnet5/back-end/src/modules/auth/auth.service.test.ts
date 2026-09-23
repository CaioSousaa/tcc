import crypto from "node:crypto";
import { AuthService } from "./auth.service";
import { EmailAlreadyInUseError, InvalidCredentialsError, InvalidSessionError } from "./auth.errors";
import { User } from "./entities/user.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import {
  CreateRefreshTokenData,
  CreateUserData,
  RefreshTokenRepository,
  RefreshTokenWithUser,
  UserRepository,
} from "./repositories/repository.types";

class FakeUserRepository implements UserRepository {
  private readonly users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      refreshTokens: [],
      boards: [],
    };
    this.users.push(user);
    return user;
  }
}

class FakeRefreshTokenRepository implements RefreshTokenRepository {
  readonly tokens: RefreshToken[] = [];
  private readonly usersById = new Map<string, User>();

  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    const token: RefreshToken = {
      id: crypto.randomUUID(),
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      revokedAt: null,
      userAgent: null,
      createdAt: new Date(),
      user: undefined as unknown as User,
    };
    this.tokens.push(token);
    return token;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenWithUser | null> {
    const found = this.tokens.find((t) => t.tokenHash === tokenHash);
    if (!found) return null;
    const owner = this.usersById.get(found.userId);
    if (!owner) return null;
    return { ...found, user: owner };
  }

  async revoke(id: string): Promise<void> {
    const token = this.tokens.find((t) => t.id === id);
    if (token) token.revokedAt = new Date();
  }

  registerUser(user: User) {
    this.usersById.set(user.id, user);
  }
}

function buildService() {
  const userRepository = new FakeUserRepository();
  const refreshTokenRepository = new FakeRefreshTokenRepository();
  const originalCreate = userRepository.create.bind(userRepository);
  userRepository.create = async (data: CreateUserData) => {
    const user = await originalCreate(data);
    refreshTokenRepository.registerUser(user);
    return user;
  };
  const service = new AuthService(userRepository, refreshTokenRepository);
  return { service, userRepository, refreshTokenRepository };
}

describe("AuthService.register (RN-01, RN-04, critérios 1, 2)", () => {
  it("creates the account and returns an already-authenticated session (critério 1, RN-04)", async () => {
    const { service } = buildService();
    const result = await service.register({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret",
    });

    expect(result.user).toEqual({ id: expect.any(String), name: "Ada Lovelace", email: "ada@example.com" });
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  it("rejects a duplicate email regardless of case (RN-01, critério 2)", async () => {
    const { service } = buildService();
    await service.register({ name: "Ada", email: "ada@example.com", password: "supersecret" });

    await expect(
      service.register({ name: "Another Ada", email: "ADA@example.com", password: "othersecret" }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });
});

describe("AuthService.login (RN-05, critérios 6, 7, 8)", () => {
  it("authenticates with correct credentials (critério 6)", async () => {
    const { service } = buildService();
    await service.register({ name: "Ada", email: "ada@example.com", password: "supersecret" });

    const result = await service.login({ email: "ada@example.com", password: "supersecret" });
    expect(result.user.email).toBe("ada@example.com");
    expect(result.accessToken).toEqual(expect.any(String));
  });

  it("rejects an email that was never registered (critério 7)", async () => {
    const { service } = buildService();
    await expect(
      service.login({ email: "ghost@example.com", password: "whatever1" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("rejects an incorrect password with the same error as an unknown email (RN-05, critério 8)", async () => {
    const { service } = buildService();
    await service.register({ name: "Ada", email: "ada@example.com", password: "supersecret" });

    let wrongPasswordError: unknown;
    let unknownEmailError: unknown;
    try {
      await service.login({ email: "ada@example.com", password: "wrong-password" });
    } catch (err) {
      wrongPasswordError = err;
    }
    try {
      await service.login({ email: "ghost@example.com", password: "whatever1" });
    } catch (err) {
      unknownEmailError = err;
    }

    expect(wrongPasswordError).toBeInstanceOf(InvalidCredentialsError);
    expect(unknownEmailError).toBeInstanceOf(InvalidCredentialsError);
    expect((wrongPasswordError as InvalidCredentialsError).message).toBe(
      (unknownEmailError as InvalidCredentialsError).message,
    );
  });
});

describe("AuthService.refresh (RN-06, critérios 10, 11, 12)", () => {
  it("issues a new session from a valid refresh token and rotates it (critérios 10, 11)", async () => {
    const { service, refreshTokenRepository } = buildService();
    const { refreshToken } = await service.register({
      name: "Ada",
      email: "ada@example.com",
      password: "supersecret",
    });

    const originalRecord = refreshTokenRepository.tokens[0];
    if (!originalRecord) throw new Error("expected a stored refresh token");

    const refreshed = await service.refresh(refreshToken);
    expect(refreshed.accessToken).toEqual(expect.any(String));
    expect(refreshed.refreshToken).not.toBe(refreshToken);
    expect(originalRecord.revokedAt).not.toBeNull();
    expect(refreshTokenRepository.tokens).toHaveLength(2);
  });

  it("rejects an expired refresh token, treating the caller as unauthenticated (RN-06, critério 12)", async () => {
    const { service, refreshTokenRepository } = buildService();
    const { refreshToken } = await service.register({
      name: "Ada",
      email: "ada@example.com",
      password: "supersecret",
    });

    const record = refreshTokenRepository.tokens[0];
    if (!record) throw new Error("expected a stored refresh token");
    record.expiresAt = new Date(Date.now() - 1000);

    await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(InvalidSessionError);
  });

  it("rejects a missing refresh token", async () => {
    const { service } = buildService();
    await expect(service.refresh(undefined)).rejects.toBeInstanceOf(InvalidSessionError);
  });

  it("rejects an unknown refresh token", async () => {
    const { service } = buildService();
    await expect(service.refresh("not-a-real-token")).rejects.toBeInstanceOf(InvalidSessionError);
  });
});

describe("AuthService.logout (critério 14)", () => {
  it("revokes the session so it can no longer be refreshed", async () => {
    const { service } = buildService();
    const { refreshToken } = await service.register({
      name: "Ada",
      email: "ada@example.com",
      password: "supersecret",
    });

    await service.logout(refreshToken);

    await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(InvalidSessionError);
  });

  it("is idempotent when called without a session (no error)", async () => {
    const { service } = buildService();
    await expect(service.logout(undefined)).resolves.toBeUndefined();
  });
});
