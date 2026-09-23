import { formatZodError, loginSchema, registerSchema } from "./auth.schemas";

describe("registerSchema (RN-02, RN-03, critérios 3, 4, 5)", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when required fields are missing (critério 3)", () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = formatZodError(result.error);
      expect(fields.name).toBeDefined();
      expect(fields.email).toBeDefined();
      expect(fields.password).toBeDefined();
    }
  });

  it("rejects an invalid email format (critério 4)", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "not-an-email",
      password: "supersecret",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = formatZodError(result.error);
      expect(fields.email).toMatch(/valid email/);
    }
  });

  it("rejects a password shorter than 8 characters (RN-02, critério 5)", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = formatZodError(result.error);
      expect(fields.password).toMatch(/at least 8/);
    }
  });
});

describe("loginSchema (critério 9)", () => {
  it("accepts a valid login payload", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects empty email or password", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = formatZodError(result.error);
      expect(fields.email).toBeDefined();
      expect(fields.password).toBeDefined();
    }
  });
});
