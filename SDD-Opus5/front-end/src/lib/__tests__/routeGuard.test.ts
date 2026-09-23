import { describe, expect, it } from "vitest";
import { SESSION_COOKIE_NAME, decideRoute } from "../routeGuard";

describe("decideRoute", () => {
  it("uses the same cookie name as the API", () => {
    expect(SESSION_COOKIE_NAME).toBe("session_token");
  });

  it("sends a visitor on a protected page to login with the original path (CA23, CA24)", () => {
    expect(decideRoute("/boards", "?tab=late", false)).toEqual({
      type: "redirect",
      to: "/login?redirect=%2Fboards%3Ftab%3Dlate",
    });
  });

  it("lets a request with a session cookie reach protected pages, uncached (CA15, CB15)", () => {
    expect(decideRoute("/boards", "", true)).toEqual({ type: "next", noStore: true });
  });

  it("sends an authenticated user away from login and register (CA25)", () => {
    expect(decideRoute("/login", "", true)).toEqual({ type: "redirect", to: "/boards" });
    expect(decideRoute("/register", "", true)).toEqual({ type: "redirect", to: "/boards" });
  });

  it("lets a visitor open login and register", () => {
    expect(decideRoute("/login", "", false)).toEqual({ type: "next", noStore: false });
    expect(decideRoute("/register", "", false)).toEqual({ type: "next", noStore: false });
  });

  it("keeps the expired-session notice reachable with a stale cookie (CA19, CB11)", () => {
    expect(decideRoute("/login", "?expired=1&redirect=%2Fboards", true)).toEqual({ type: "next", noStore: false });
  });

  it("routes / by the presence of the session cookie", () => {
    expect(decideRoute("/", "", true)).toEqual({ type: "redirect", to: "/boards" });
    expect(decideRoute("/", "", false)).toEqual({ type: "redirect", to: "/login" });
  });

  it("does not treat look-alike paths as public", () => {
    expect(decideRoute("/login-admin", "", false).type).toBe("redirect");
  });
});
