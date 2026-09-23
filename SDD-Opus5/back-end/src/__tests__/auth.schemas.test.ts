import { describe, expect, it } from "vitest";
import { MESSAGES } from "../errors/messages";
import { parseLoginInput, parseRegisterInput } from "../schemas/auth.schemas";
import { VALID_REGISTER } from "./helpers/factories";

function registerFields(overrides: Record<string, unknown>) {
  const result = parseRegisterInput({ ...VALID_REGISTER, ...overrides });
  if (result.success) throw new Error("expected validation failure");
  return result.fields;
}

describe("parseRegisterInput", () => {
  it("accepts valid data (CA01)", () => {
    const result = parseRegisterInput(VALID_REGISTER);
    expect(result).toEqual({
      success: true,
      data: { name: "Ana Lima", email: "ana@empresa.com", password: "senha12345" },
    });
  });

  it("does not expose confirmPassword in the parsed data (RN06)", () => {
    const result = parseRegisterInput(VALID_REGISTER);
    expect(result.success && "confirmPassword" in result.data).toBe(false);
  });

  it("normalizes the e-mail to lowercase without surrounding spaces (RN02, CB02)", () => {
    const result = parseRegisterInput({ ...VALID_REGISTER, email: "  Ana@Empresa.COM  " });
    expect(result.success && result.data.email).toBe("ana@empresa.com");
  });

  it("trims the name (CA08)", () => {
    const result = parseRegisterInput({ ...VALID_REGISTER, name: "  Ana Lima  " });
    expect(result.success && result.data.name).toBe("Ana Lima");
  });

  it("preserves accents, hyphens, apostrophes and non-latin characters (CB03)", () => {
    for (const name of ["José D'Ávila-Souza", "李小龍", "Zoë"]) {
      const result = parseRegisterInput({ ...VALID_REGISTER, name });
      expect(result.success && result.data.name).toBe(name);
    }
  });

  it("keeps HTML in the name as literal text (CB08)", () => {
    const name = "<script>alert(1)</script>";
    const result = parseRegisterInput({ ...VALID_REGISTER, name });
    expect(result.success && result.data.name).toBe(name);
  });

  it("reports every required field at once when all are empty (CA07)", () => {
    const result = parseRegisterInput({ name: "", email: "", password: "", confirmPassword: "" });
    expect(result).toEqual({
      success: false,
      fields: {
        name: MESSAGES.required,
        email: MESSAGES.required,
        password: MESSAGES.required,
        confirmPassword: MESSAGES.required,
      },
    });
  });

  it("treats missing fields and non-object bodies as empty (CA07)", () => {
    for (const body of [undefined, null, "text", [], {}]) {
      const result = parseRegisterInput(body);
      expect(result.success).toBe(false);
      if (!result.success) expect(Object.keys(result.fields).sort()).toEqual(["confirmPassword", "email", "name", "password"]);
    }
  });

  it("treats whitespace-only values as empty (CB01)", () => {
    expect(registerFields({ name: "   ", email: "  ", password: "        ", confirmPassword: "   " })).toEqual({
      name: MESSAGES.required,
      email: MESSAGES.required,
      password: MESSAGES.required,
      confirmPassword: MESSAGES.required,
    });
  });

  it.each(["ana@", "ana", "@empresa.com", "ana@empresa", "ana@empresa.c", "ana @empresa.com", "ana@@empresa.com"])(
    "rejects malformed e-mail %s (CA04, RN03)",
    (email) => {
      expect(registerFields({ email })).toEqual({ email: MESSAGES.invalidEmail });
    },
  );

  it("accepts an e-mail with exactly 254 characters and rejects 255 (RN03, CB10)", () => {
    const suffix = "@empresa.com";
    const at254 = "a".repeat(254 - suffix.length) + suffix;
    const at255 = "a".repeat(255 - suffix.length) + suffix;
    expect(parseRegisterInput({ ...VALID_REGISTER, email: at254 }).success).toBe(true);
    expect(registerFields({ email: at255 })).toEqual({ email: MESSAGES.invalidEmail });
  });

  it("rejects a 7-character password (CA05)", () => {
    expect(registerFields({ password: "1234567", confirmPassword: "1234567" })).toEqual({
      password: MESSAGES.passwordTooShort,
    });
  });

  it("accepts a password with exactly 8 and 100 characters (CB05)", () => {
    for (const password of ["12345678", "x".repeat(100)]) {
      expect(parseRegisterInput({ ...VALID_REGISTER, password, confirmPassword: password }).success).toBe(true);
    }
  });

  it("rejects a password with more than 100 characters (CB06)", () => {
    const password = "x".repeat(101);
    expect(registerFields({ password, confirmPassword: password })).toEqual({
      password: MESSAGES.passwordTooLong,
    });
  });

  it("never trims the password (RN05, CB07)", () => {
    const password = "  senha 12345  ";
    const result = parseRegisterInput({ ...VALID_REGISTER, password, confirmPassword: password });
    expect(result.success && result.data.password).toBe(password);
  });

  it("rejects a confirmation that differs from the password (CA06)", () => {
    expect(registerFields({ password: "senha12345", confirmPassword: "senha54321" })).toEqual({
      confirmPassword: MESSAGES.passwordMismatch,
    });
  });

  it("treats a confirmation differing only by surrounding spaces as a mismatch (RN06)", () => {
    expect(registerFields({ password: "senha12345", confirmPassword: " senha12345 " })).toEqual({
      confirmPassword: MESSAGES.passwordMismatch,
    });
  });

  it("reports the mismatch together with other field errors (spec 2.1)", () => {
    expect(registerFields({ name: "A", email: "ana@", confirmPassword: "outra-senha" })).toEqual({
      name: MESSAGES.nameLength,
      email: MESSAGES.invalidEmail,
      confirmPassword: MESSAGES.passwordMismatch,
    });
  });

  it("enforces name length between 2 and 100 after trimming (RN04, CB04)", () => {
    expect(registerFields({ name: "A" })).toEqual({ name: MESSAGES.nameLength });
    expect(registerFields({ name: "  A  " })).toEqual({ name: MESSAGES.nameLength });
    expect(registerFields({ name: "a".repeat(101) })).toEqual({ name: MESSAGES.nameLength });
    expect(parseRegisterInput({ ...VALID_REGISTER, name: "Al" }).success).toBe(true);
    expect(parseRegisterInput({ ...VALID_REGISTER, name: "a".repeat(100) }).success).toBe(true);
  });

  it("rejects non-string values as required", () => {
    expect(registerFields({ name: 123, email: true })).toEqual({
      name: MESSAGES.required,
      email: MESSAGES.required,
    });
  });
});

describe("parseLoginInput", () => {
  it("requires e-mail and password (CA14)", () => {
    expect(parseLoginInput({ email: "", password: "" })).toEqual({
      success: false,
      fields: { email: MESSAGES.required, password: MESSAGES.required },
    });
  });

  it("normalizes the e-mail (CA10, CB02)", () => {
    const result = parseLoginInput({ email: "  ANA@EMPRESA.COM ", password: "senha12345" });
    expect(result.success && result.data.email).toBe("ana@empresa.com");
  });

  it("keeps the password untouched, including case and spaces (CA13, CB07)", () => {
    const result = parseLoginInput({ email: "ana@empresa.com", password: " SENHA12345 " });
    expect(result.success && result.data.password).toBe(" SENHA12345 ");
  });

  it("defaults rememberMe to true (RN10)", () => {
    const result = parseLoginInput({ email: "ana@empresa.com", password: "senha12345" });
    expect(result.success && result.data.rememberMe).toBe(true);
  });

  it("honours rememberMe false", () => {
    const result = parseLoginInput({ email: "ana@empresa.com", password: "senha12345", rememberMe: false });
    expect(result.success && result.data.rememberMe).toBe(false);
  });

  it("rejects a non-boolean rememberMe", () => {
    const result = parseLoginInput({ email: "ana@empresa.com", password: "senha12345", rememberMe: "yes" });
    expect(result).toEqual({ success: false, fields: { rememberMe: MESSAGES.invalidValue } });
  });

  it("does not apply the sign-up length rule to login passwords", () => {
    expect(parseLoginInput({ email: "ana@empresa.com", password: "curta" }).success).toBe(true);
  });
});
