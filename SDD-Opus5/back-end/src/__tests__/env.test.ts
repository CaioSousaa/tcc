import { describe, expect, it } from "vitest";
import { parseEnv } from "../config/env";

const BASE = {
  POSTGRES_USER: "postgres",
  POSTGRES_PASSWORD: "postgres",
  POSTGRES_DB: "tcc_db",
  JWT_SECRET: "x".repeat(32),
  CORS_ORIGIN: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("applies the session durations from RN09 by default", () => {
    const env = parseEnv(BASE);
    expect(env.SESSION_PERSISTENT_TTL_DAYS).toBe(30);
    expect(env.SESSION_SHORT_TTL_HOURS).toBe(8);
  });

  it("aborts when JWT_SECRET is missing (N12)", () => {
    const { JWT_SECRET: _omit, ...withoutSecret } = BASE;
    expect(() => parseEnv(withoutSecret)).toThrow(/JWT_SECRET/);
  });

  it("aborts when JWT_SECRET is shorter than 32 characters (C16)", () => {
    expect(() => parseEnv({ ...BASE, JWT_SECRET: "x".repeat(31) })).toThrow(/JWT_SECRET/);
  });

  it("refuses a wildcard CORS origin (A17)", () => {
    expect(() => parseEnv({ ...BASE, CORS_ORIGIN: "*" })).toThrow(/CORS_ORIGIN/);
  });
});
