import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../errors/AppError";
import { authenticate } from "../middlewares/authenticate";
import { SESSION_COOKIE_NAME } from "../utils/cookies";
import { makeAuthContext, makeTokenService } from "./helpers/factories";

const REGISTER = { name: "Ana Lima", email: "ana@empresa.com", password: "senha12345" };

type NextSpy = ReturnType<typeof vi.fn<(error?: unknown) => void>>;

async function run(middleware: ReturnType<typeof authenticate>, req: Partial<Request>): Promise<NextSpy> {
  const next = vi.fn<(error?: unknown) => void>();
  await middleware(req as Request, {} as Response, next as unknown as NextFunction);
  return next;
}

function errorCode(next: NextSpy): string | undefined {
  const error = next.mock.calls[0]?.[0];
  return error instanceof AppError ? error.code : undefined;
}

describe("authenticate middleware", () => {
  it("attaches the user from a valid session cookie (CA15, CA22)", async () => {
    const { authService } = makeAuthContext();
    const { user, token } = await authService.register(REGISTER);
    const req: Partial<Request> = { cookies: { [SESSION_COOKIE_NAME]: token } };

    const next = await run(authenticate(authService), req);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(user);
  });

  it("rejects a request without cookie as UNAUTHENTICATED (CA23)", async () => {
    const { authService } = makeAuthContext();
    const next = await run(authenticate(authService), { cookies: {} });
    expect(errorCode(next)).toBe("UNAUTHENTICATED");
  });

  it("rejects when cookie-parser produced no cookies object", async () => {
    const { authService } = makeAuthContext();
    const next = await run(authenticate(authService), {});
    expect(errorCode(next)).toBe("UNAUTHENTICATED");
  });

  it("rejects a tampered cookie as UNAUTHENTICATED (CB12)", async () => {
    const { authService } = makeAuthContext();
    const next = await run(authenticate(authService), { cookies: { [SESSION_COOKIE_NAME]: "tampered.token.value" } });
    expect(errorCode(next)).toBe("UNAUTHENTICATED");
  });

  it("rejects an expired session as SESSION_EXPIRED (CA19, CB11)", async () => {
    const { authService, tokens } = makeAuthContext();
    vi.spyOn(tokens, "verify").mockReturnValue({ status: "expired" });
    const next = await run(authenticate(authService), { cookies: { [SESSION_COOKIE_NAME]: "expired" } });
    expect(errorCode(next)).toBe("SESSION_EXPIRED");
  });

  it("ignores identity sent in the body, query or headers (RN13)", async () => {
    const { authService } = makeAuthContext();
    const victim = await authService.register({ ...REGISTER, email: "vitima@empresa.com" });
    const attacker = await authService.register(REGISTER);
    const req: Partial<Request> = {
      cookies: { [SESSION_COOKIE_NAME]: attacker.token },
      body: { userId: victim.user.id },
      headers: { "x-user-id": victim.user.id },
    };

    await run(authenticate(authService), req);

    expect(req.user?.id).toBe(attacker.user.id);
  });

  it("rejects a token for a deleted account (CB12)", async () => {
    const { authService } = makeAuthContext();
    const token = makeTokenService().sign("7d1f2a57-4f7e-4a41-9d2c-2d8a7f7e1b10", "persistent");
    const next = await run(authenticate(authService), { cookies: { [SESSION_COOKIE_NAME]: token } });
    expect(errorCode(next)).toBe("UNAUTHENTICATED");
  });
});
