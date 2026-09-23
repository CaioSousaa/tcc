import { Request, Response } from "express";
import { authenticate } from "./auth.middleware";
import { UnauthenticatedError } from "./auth.errors";
import { signAccessToken } from "./tokens";

function buildRequest(authorization?: string): Request {
  return { headers: { authorization } } as unknown as Request;
}

describe("authenticate middleware (RN-08, critério 13)", () => {
  it("attaches the authenticated user and calls next() with no error for a valid token", () => {
    const token = signAccessToken({ sub: "user-1", email: "user@example.com" });
    const req = buildRequest(`Bearer ${token}`);
    const next = jest.fn();

    authenticate(req, {} as Response, next);

    expect(req.user).toEqual({ id: "user-1", email: "user@example.com" });
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects a request with no Authorization header", () => {
    const req = buildRequest(undefined);
    const next = jest.fn();

    authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError));
  });

  it("rejects a request with a malformed Authorization header", () => {
    const req = buildRequest("Token something");
    const next = jest.fn();

    authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError));
  });

  it("rejects a request with an invalid/expired token", () => {
    const req = buildRequest("Bearer not-a-real-token");
    const next = jest.fn();

    authenticate(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthenticatedError));
  });
});
