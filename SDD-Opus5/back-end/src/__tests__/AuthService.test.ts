import { describe, expect, it, vi } from "vitest";
import { AppError, UniqueConstraintError } from "../errors/AppError";
import { toPublicUser } from "../services/AuthService";
import { makeAuthContext, makeTokenService } from "./helpers/factories";

const REGISTER = { name: "Ana Lima", email: "ana@empresa.com", password: "senha12345" };

async function expectAppError(promise: Promise<unknown>, code: AppError["code"]) {
  await expect(promise).rejects.toBeInstanceOf(AppError);
  await promise.catch((error: AppError) => expect(error.code).toBe(code));
}

describe("AuthService.register", () => {
  it("creates the account and returns a persistent session (CA01, CA18, RN10)", async () => {
    const { authService, users, tokens } = makeAuthContext();
    const result = await authService.register(REGISTER);

    expect(result.user).toEqual({ id: expect.any(String), name: "Ana Lima", email: "ana@empresa.com" });
    expect(result.sessionKind).toBe("persistent");
    expect(tokens.verify(result.token)).toEqual({ status: "valid", userId: result.user.id });
    expect(users.rows.size).toBe(1);
  });

  it("stores a hash, never the password (RN07)", async () => {
    const { authService, users, passwords } = makeAuthContext();
    const { user } = await authService.register(REGISTER);
    const row = users.rows.get(user.id);

    expect(row?.passwordHash).not.toBe(REGISTER.password);
    await expect(passwords.verify(REGISTER.password, row?.passwordHash ?? "")).resolves.toBe(true);
  });

  it("returns only id, name and email (C14, RN07)", async () => {
    const { authService } = makeAuthContext();
    const { user } = await authService.register(REGISTER);
    expect(Object.keys(user).sort()).toEqual(["email", "id", "name"]);
  });

  it("uses a UUID as identifier (D5)", async () => {
    const { authService } = makeAuthContext();
    const { user } = await authService.register(REGISTER);
    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("refuses an e-mail already registered (CA02)", async () => {
    const { authService, users } = makeAuthContext();
    await authService.register(REGISTER);
    await expectAppError(authService.register({ ...REGISTER, name: "Outra" }), "EMAIL_ALREADY_EXISTS");
    expect(users.rows.size).toBe(1);
  });

  it("maps a unique-index violation from a concurrent sign-up to EMAIL_ALREADY_EXISTS (CB09, C07)", async () => {
    const { authService, users } = makeAuthContext();
    vi.spyOn(users, "existsByEmail").mockResolvedValue(false);
    vi.spyOn(users, "create").mockRejectedValue(new UniqueConstraintError("UQ_users_email"));

    await expectAppError(authService.register(REGISTER), "EMAIL_ALREADY_EXISTS");
  });

  it("only one of two simultaneous sign-ups with the same e-mail succeeds (CB09)", async () => {
    const { authService, users } = makeAuthContext();
    const results = await Promise.allSettled([authService.register(REGISTER), authService.register(REGISTER)]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect((rejected.reason as AppError).code).toBe("EMAIL_ALREADY_EXISTS");
    expect(users.rows.size).toBe(1);
  });

  it("persists nothing when the session token cannot be issued (RN15)", async () => {
    const { authService, users, tokens } = makeAuthContext();
    vi.spyOn(tokens, "sign").mockImplementation(() => {
      throw new Error("signing failed");
    });

    await expect(authService.register(REGISTER)).rejects.toThrow("signing failed");
    expect(users.rows.size).toBe(0);
  });

  it("propagates unexpected persistence failures without creating a session (CE02)", async () => {
    const { authService, users } = makeAuthContext();
    vi.spyOn(users, "create").mockRejectedValue(new Error("connection lost"));

    await expect(authService.register(REGISTER)).rejects.toThrow("connection lost");
    expect(users.rows.size).toBe(0);
  });
});

describe("AuthService.login", () => {
  async function registered() {
    const context = makeAuthContext();
    const { user } = await context.authService.register(REGISTER);
    return { ...context, user };
  }

  it("authenticates with correct credentials (CA09)", async () => {
    const { authService, user } = await registered();
    const result = await authService.login({ email: "ana@empresa.com", password: "senha12345", rememberMe: true });
    expect(result.user).toEqual(user);
  });

  it("creates a persistent session when rememberMe is true (CA16)", async () => {
    const { authService } = await registered();
    const result = await authService.login({ email: "ana@empresa.com", password: "senha12345", rememberMe: true });
    expect(result.sessionKind).toBe("persistent");
  });

  it("creates a short session when rememberMe is false (CA17)", async () => {
    const { authService } = await registered();
    const result = await authService.login({ email: "ana@empresa.com", password: "senha12345", rememberMe: false });
    expect(result.sessionKind).toBe("short");
  });

  it("returns a token for the same account on each login, independently (CA20, RN11)", async () => {
    const { authService, tokens, user } = await registered();
    const deviceA = await authService.login({ email: "ana@empresa.com", password: "senha12345", rememberMe: true });
    const deviceB = await authService.login({ email: "ana@empresa.com", password: "senha12345", rememberMe: false });
    expect(tokens.verify(deviceA.token)).toEqual({ status: "valid", userId: user.id });
    expect(tokens.verify(deviceB.token)).toEqual({ status: "valid", userId: user.id });
  });

  it("rejects a wrong password with INVALID_CREDENTIALS (CA11)", async () => {
    const { authService } = await registered();
    await expectAppError(
      authService.login({ email: "ana@empresa.com", password: "senhaerrada", rememberMe: true }),
      "INVALID_CREDENTIALS",
    );
  });

  it("rejects a password with different case (CA13)", async () => {
    const { authService } = await registered();
    await expectAppError(
      authService.login({ email: "ana@empresa.com", password: "SENHA12345", rememberMe: true }),
      "INVALID_CREDENTIALS",
    );
  });

  it("rejects an unknown e-mail with exactly the same error as a wrong password (CA12, RN08)", async () => {
    const { authService } = await registered();
    const wrongPassword = await authService
      .login({ email: "ana@empresa.com", password: "senhaerrada", rememberMe: true })
      .catch((error: AppError) => error);
    const unknownEmail = await authService
      .login({ email: "ninguem@empresa.com", password: "senhaerrada", rememberMe: true })
      .catch((error: AppError) => error);

    expect(unknownEmail).toBeInstanceOf(AppError);
    expect(wrongPassword).toBeInstanceOf(AppError);
    expect({ code: (unknownEmail as AppError).code, message: (unknownEmail as AppError).message }).toEqual({
      code: (wrongPassword as AppError).code,
      message: (wrongPassword as AppError).message,
    });
  });

  it("still runs a hash comparison when the e-mail does not exist (C05, RN08)", async () => {
    const { authService, passwords } = await registered();
    const dummy = vi.spyOn(passwords, "verifyAgainstDummy");

    await expectAppError(
      authService.login({ email: "ninguem@empresa.com", password: "qualquer", rememberMe: true }),
      "INVALID_CREDENTIALS",
    );
    expect(dummy).toHaveBeenCalledWith("qualquer");
  });
});

describe("AuthService.resolveSession", () => {
  it("resolves a valid token to the public user (CA15, CA22)", async () => {
    const { authService } = makeAuthContext();
    const { user, token } = await authService.register(REGISTER);
    await expect(authService.resolveSession(token)).resolves.toEqual({ status: "valid", user });
  });

  it("treats a missing token as invalid (CB12)", async () => {
    const { authService } = makeAuthContext();
    await expect(authService.resolveSession(undefined)).resolves.toEqual({ status: "invalid" });
    await expect(authService.resolveSession("")).resolves.toEqual({ status: "invalid" });
  });

  it("reports an expired token (CA19)", async () => {
    const { authService, tokens } = makeAuthContext();
    vi.spyOn(tokens, "verify").mockReturnValue({ status: "expired" });
    await expect(authService.resolveSession("any")).resolves.toEqual({ status: "expired" });
  });

  it("treats a token for an account that no longer exists as invalid (CB12)", async () => {
    const { authService } = makeAuthContext();
    const token = makeTokenService().sign("7d1f2a57-4f7e-4a41-9d2c-2d8a7f7e1b10", "persistent");
    await expect(authService.resolveSession(token)).resolves.toEqual({ status: "invalid" });
  });

  it("treats a token whose subject is not a UUID as invalid without querying (CB12)", async () => {
    const { authService, users } = makeAuthContext();
    const findById = vi.spyOn(users, "findById");
    const token = makeTokenService().sign("not-a-uuid", "persistent");
    await expect(authService.resolveSession(token)).resolves.toEqual({ status: "invalid" });
    expect(findById).not.toHaveBeenCalled();
  });

  it("resolves each token to its own account (CA26, RN13)", async () => {
    const { authService } = makeAuthContext();
    const a = await authService.register(REGISTER);
    const b = await authService.register({ ...REGISTER, name: "Bruno", email: "bruno@empresa.com" });

    await expect(authService.resolveSession(a.token)).resolves.toEqual({ status: "valid", user: a.user });
    await expect(authService.resolveSession(b.token)).resolves.toEqual({ status: "valid", user: b.user });
  });
});

describe("toPublicUser", () => {
  it("drops every field other than id, name and email (C14)", () => {
    const row = { id: "1", name: "Ana", email: "ana@empresa.com", passwordHash: "hash" };
    expect(toPublicUser(row)).toEqual({ id: "1", name: "Ana", email: "ana@empresa.com" });
  });
});
