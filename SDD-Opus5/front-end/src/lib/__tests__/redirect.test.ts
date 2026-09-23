import { describe, expect, it } from "vitest";
import { DEFAULT_AUTHENTICATED_PATH, loginUrl, safeRedirect } from "../redirect";

describe("safeRedirect (A20, C19)", () => {
  it.each(["/boards", "/boards/123", "/boards?filter=late", "/boards#top"])("keeps internal path %s (CA24)", (path) => {
    expect(safeRedirect(path)).toBe(path);
  });

  it.each([
    undefined,
    null,
    "",
    "boards",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    `/boards${String.fromCharCode(10)}Set-Cookie: x`,
  ])("falls back to the default area for %s", (value) => {
    expect(safeRedirect(value)).toBe(DEFAULT_AUTHENTICATED_PATH);
  });

  it("never sends an authenticated user back to login or register (CA25)", () => {
    expect(safeRedirect("/login")).toBe(DEFAULT_AUTHENTICATED_PATH);
    expect(safeRedirect("/register?x=1")).toBe(DEFAULT_AUTHENTICATED_PATH);
  });

  it("uses /boards as the initial authenticated area", () => {
    expect(DEFAULT_AUTHENTICATED_PATH).toBe("/boards");
  });
});

describe("loginUrl", () => {
  it("returns plain /login without options", () => {
    expect(loginUrl()).toBe("/login");
  });

  it("carries the original destination (CA24)", () => {
    expect(loginUrl({ redirect: "/boards/42" })).toBe("/login?redirect=%2Fboards%2F42");
  });

  it("flags an expired session (CA19, A21)", () => {
    expect(loginUrl({ redirect: "/boards", expired: true })).toBe("/login?redirect=%2Fboards&expired=1");
  });

  it("drops an unsafe destination", () => {
    expect(loginUrl({ redirect: "//evil.example" })).toBe("/login");
  });
});
