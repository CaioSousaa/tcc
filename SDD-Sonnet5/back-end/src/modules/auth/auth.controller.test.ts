import { Request, Response } from "express";
import { REFRESH_COOKIE_NAME, buildAuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidSessionError,
} from "./auth.errors";

function buildRes() {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

function buildReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, cookies: {}, ...overrides } as unknown as Request;
}

function fakeService(overrides: Partial<AuthService> = {}): AuthService {
  return {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    ...overrides,
  } as unknown as AuthService;
}

const sessionResult = {
  user: { id: "user-1", name: "Ada", email: "ada@example.com" },
  accessToken: "access-token-value",
  refreshToken: "refresh-token-value",
  refreshTokenExpiresAt: new Date(Date.now() + 1000),
};

describe("auth.controller — register (critérios 1, 2, 3, RN-04)", () => {
  it("returns 201 with user + accessToken, and sets the refresh cookie httpOnly (critério 1, RN-04)", async () => {
    const service = fakeService({ register: jest.fn().mockResolvedValue(sessionResult) });
    const controller = buildAuthController(service);
    const req = buildReq({ body: { name: "Ada", email: "ada@example.com", password: "supersecret" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      user: sessionResult.user,
      accessToken: sessionResult.accessToken,
    });
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      sessionResult.refreshToken,
      expect.objectContaining({ httpOnly: true, path: "/auth" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards a validation error to the error handler instead of calling the service (critério 3)", async () => {
    const service = fakeService();
    const controller = buildAuthController(service);
    const req = buildReq({ body: { email: "not-an-email" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.register(req, res, next);

    expect(service.register).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: "validation_error" }),
    );
  });

  it("forwards EmailAlreadyInUseError as 409 to the error handler (critério 2)", async () => {
    const service = fakeService({
      register: jest.fn().mockRejectedValue(new EmailAlreadyInUseError()),
    });
    const controller = buildAuthController(service);
    const req = buildReq({ body: { name: "Ada", email: "ada@example.com", password: "supersecret" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.register(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, code: "email_already_in_use" }),
    );
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("auth.controller — login (critérios 6, 7, 8, 9, RN-05)", () => {
  it("returns 200 with user + accessToken on success (critério 6)", async () => {
    const service = fakeService({ login: jest.fn().mockResolvedValue(sessionResult) });
    const controller = buildAuthController(service);
    const req = buildReq({ body: { email: "ada@example.com", password: "supersecret" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: sessionResult.user,
      accessToken: sessionResult.accessToken,
    });
  });

  it("forwards InvalidCredentialsError as 401 for both unknown email and wrong password (RN-05, critérios 7, 8)", async () => {
    const service = fakeService({
      login: jest.fn().mockRejectedValue(new InvalidCredentialsError()),
    });
    const controller = buildAuthController(service);
    const req = buildReq({ body: { email: "ghost@example.com", password: "whatever1" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.login(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: "invalid_credentials" }),
    );
  });

  it("rejects an empty payload before calling the service (critério 9)", async () => {
    const service = fakeService();
    const controller = buildAuthController(service);
    const req = buildReq({ body: {} });
    const res = buildRes();
    const next = jest.fn();

    await controller.login(req, res, next);

    expect(service.login).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});

describe("auth.controller — refresh (critérios 10, 11, 12)", () => {
  it("returns a new accessToken and rotates the refresh cookie (critérios 10, 11)", async () => {
    const service = fakeService({ refresh: jest.fn().mockResolvedValue(sessionResult) });
    const controller = buildAuthController(service);
    const req = buildReq({ cookies: { [REFRESH_COOKIE_NAME]: "old-refresh-token" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.refresh(req, res, next);

    expect(service.refresh).toHaveBeenCalledWith("old-refresh-token");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ accessToken: sessionResult.accessToken });
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      sessionResult.refreshToken,
      expect.any(Object),
    );
  });

  it("forwards InvalidSessionError as 401 for a missing/expired/revoked cookie (RN-06, critério 12)", async () => {
    const service = fakeService({
      refresh: jest.fn().mockRejectedValue(new InvalidSessionError()),
    });
    const controller = buildAuthController(service);
    const req = buildReq({ cookies: {} });
    const res = buildRes();
    const next = jest.fn();

    await controller.refresh(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: "invalid_session" }),
    );
  });
});

describe("auth.controller — logout (critério 14)", () => {
  it("revokes the session, clears the cookie and returns 204", async () => {
    const service = fakeService({ logout: jest.fn().mockResolvedValue(undefined) });
    const controller = buildAuthController(service);
    const req = buildReq({ cookies: { [REFRESH_COOKIE_NAME]: "some-refresh-token" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.logout(req, res, next);

    expect(service.logout).toHaveBeenCalledWith("some-refresh-token");
    expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_COOKIE_NAME, { path: "/auth" });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("is idempotent when called without a session cookie", async () => {
    const service = fakeService({ logout: jest.fn().mockResolvedValue(undefined) });
    const controller = buildAuthController(service);
    const req = buildReq({ cookies: {} });
    const res = buildRes();
    const next = jest.fn();

    await controller.logout(req, res, next);

    expect(service.logout).toHaveBeenCalledWith(undefined);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("auth.controller — me (RN-08, critério 13)", () => {
  it("returns the authenticated user attached by the authenticate middleware", async () => {
    const service = fakeService();
    const controller = buildAuthController(service);
    const req = buildReq({ user: { id: "user-1", email: "ada@example.com" } });
    const res = buildRes();
    const next = jest.fn();

    await controller.me(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: "user-1", email: "ada@example.com" });
  });

  it("forwards UnauthenticatedError as 401 when no user is attached", async () => {
    const service = fakeService();
    const controller = buildAuthController(service);
    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await controller.me(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: "unauthenticated" }),
    );
  });
});
