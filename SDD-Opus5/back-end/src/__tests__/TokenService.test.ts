import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PERSISTENT_TTL_SECONDS, SHORT_TTL_SECONDS, TEST_SECRET, makeTokenService } from "./helpers/factories";

const USER_ID = "7d1f2a57-4f7e-4a41-9d2c-2d8a7f7e1b10";

describe("TokenService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("refuses a secret shorter than 32 characters (C16, N12)", () => {
    expect(() => makeTokenService("short-secret")).toThrow();
  });

  it("signs with HS256 and carries only sub, iat and exp (A13, A14, A15)", () => {
    const token = makeTokenService().sign(USER_ID, "persistent");
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.alg).toBe("HS256");
    expect(Object.keys(decoded?.payload as object).sort()).toEqual(["exp", "iat", "sub"]);
    expect((decoded?.payload as jwt.JwtPayload).sub).toBe(USER_ID);
  });

  it("expires a persistent session after 30 days (RN09)", () => {
    const token = makeTokenService().sign(USER_ID, "persistent");
    const payload = jwt.decode(token) as jwt.JwtPayload;
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(PERSISTENT_TTL_SECONDS);
  });

  it("expires a short session after 8 hours (RN09)", () => {
    const token = makeTokenService().sign(USER_ID, "short");
    const payload = jwt.decode(token) as jwt.JwtPayload;
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(SHORT_TTL_SECONDS);
  });

  it("verifies a valid token", () => {
    const service = makeTokenService();
    expect(service.verify(service.sign(USER_ID, "short"))).toEqual({ status: "valid", userId: USER_ID });
  });

  it("reports an expired token as expired, without renewal (CA19, A16)", () => {
    const service = makeTokenService();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = service.sign(USER_ID, "short");
    vi.setSystemTime(new Date("2026-01-01T08:00:01Z"));
    expect(service.verify(token)).toEqual({ status: "expired" });
  });

  it("keeps a short session valid just before 8 hours", () => {
    const service = makeTokenService();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = service.sign(USER_ID, "short");
    vi.setSystemTime(new Date("2026-01-01T07:59:00Z"));
    expect(service.verify(token).status).toBe("valid");
  });

  it.each([
    ["garbage", "not-a-jwt"],
    ["empty", ""],
    ["signed with another secret", jwt.sign({}, "another-secret-with-at-least-32-chars!!", { subject: USER_ID })],
    ["alg none", `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(`{"sub":"${USER_ID}"}`).toString("base64url")}.`],
    ["other algorithm with the same secret", jwt.sign({}, TEST_SECRET, { subject: USER_ID, algorithm: "HS512" })],
    ["without subject", jwt.sign({}, TEST_SECRET, { algorithm: "HS256" })],
  ])("rejects a token that is %s (CB12)", (_label, token) => {
    expect(makeTokenService().verify(token)).toEqual({ status: "invalid" });
  });

  it("rejects a tampered token (CB12)", () => {
    const service = makeTokenService();
    const [header, , signature] = service.sign(USER_ID, "persistent").split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ sub: "someone-else", iat: 1, exp: 9999999999 })).toString("base64url");
    expect(service.verify(`${header}.${forgedPayload}.${signature}`)).toEqual({ status: "invalid" });
  });
});
