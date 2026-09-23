import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from "./tokens";

describe("access token (JWT)", () => {
  it("round-trips the payload used to identify the authenticated user", () => {
    const token = signAccessToken({ sub: "user-1", email: "user@example.com" });
    const payload = verifyAccessToken(token);
    expect(payload).toEqual({ sub: "user-1", email: "user@example.com" });
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken({ sub: "user-1", email: "user@example.com" });
    const tampered = `${token}tampered`;
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});

describe("refresh token (RN-06, RN-07)", () => {
  it("never persists the raw token, only its hash", () => {
    const { token, hash } = generateRefreshToken();
    expect(hash).not.toBe(token);
    expect(hash).toBe(hashRefreshToken(token));
  });

  it("generates unpredictable, non-repeating tokens", () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();
    expect(first.token).not.toBe(second.token);
    expect(first.hash).not.toBe(second.hash);
  });
});
