import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  sessionCookieOptions,
  setSessionCookie,
} from "../utils/cookies";

const config = { secure: false, persistentMaxAgeMs: 30 * 24 * 60 * 60 * 1000 };

function fakeResponse() {
  return { cookie: vi.fn(), clearCookie: vi.fn() };
}

describe("session cookie", () => {
  it("is HttpOnly, SameSite=Lax and scoped to / (C01, plan 4.7)", () => {
    const options = sessionCookieOptions("persistent", config);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("has a 30-day Max-Age for a persistent session (CA16, CA18, C02)", () => {
    expect(sessionCookieOptions("persistent", config).maxAge).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("has no Max-Age for a short session, so it dies with the browser (CA17, A11)", () => {
    const options = sessionCookieOptions("short", config);
    expect(options.maxAge).toBeUndefined();
    expect(options.expires).toBeUndefined();
  });

  it("is Secure only when configured for production", () => {
    expect(sessionCookieOptions("short", config).secure).toBe(false);
    expect(sessionCookieOptions("short", { ...config, secure: true }).secure).toBe(true);
  });

  it("sets the cookie under the session_token name", () => {
    const res = fakeResponse();
    setSessionCookie(res as unknown as Response, "token-value", "persistent", config);
    expect(res.cookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, "token-value", sessionCookieOptions("persistent", config));
    expect(SESSION_COOKIE_NAME).toBe("session_token");
  });

  it("clears the cookie with the same attributes it was set with (plan 4.4)", () => {
    const res = fakeResponse();
    clearSessionCookie(res as unknown as Response, config);
    expect(res.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, sessionCookieOptions("short", config));
  });
});
