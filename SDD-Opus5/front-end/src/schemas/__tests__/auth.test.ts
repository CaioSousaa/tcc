import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/lib/messages";
import { validateLogin, validateRegister, type RegisterForm } from "../auth";

const VALID: RegisterForm = {
  name: "Ana Lima",
  email: "ana@empresa.com",
  password: "senha12345",
  confirmPassword: "senha12345",
};

function registerErrors(overrides: Partial<RegisterForm>) {
  const result = validateRegister({ ...VALID, ...overrides });
  if (result.success) throw new Error("expected validation failure");
  return result.fields;
}

describe("messages", () => {
  it("match the spec table, section 5.4", () => {
    expect(MESSAGES).toMatchObject({
      required: "Campo obrigatório.",
      invalidEmail: "Informe um e-mail válido.",
      passwordTooShort: "A senha deve ter no mínimo 8 caracteres.",
      passwordMismatch: "As senhas não coincidem.",
      nameLength: "O nome deve ter entre 2 e 100 caracteres.",
      sessionExpired: "Sua sessão expirou. Entre novamente.",
      unexpected: "Não foi possível concluir a operação. Tente novamente.",
    });
  });
});

describe("validateRegister", () => {
  it("accepts valid data and normalizes name and e-mail (CA01, CA08, RN02)", () => {
    expect(validateRegister({ ...VALID, name: "  Ana Lima ", email: " Ana@Empresa.COM " })).toEqual({
      success: true,
      data: { name: "Ana Lima", email: "ana@empresa.com", password: "senha12345", confirmPassword: "senha12345" },
    });
  });

  it("reports all four required fields at once (CA07, CB01)", () => {
    expect(registerErrors({ name: " ", email: "", password: "   ", confirmPassword: "" })).toEqual({
      name: MESSAGES.required,
      email: MESSAGES.required,
      password: MESSAGES.required,
      confirmPassword: MESSAGES.required,
    });
  });

  it("rejects an invalid e-mail (CA04)", () => {
    expect(registerErrors({ email: "ana@" })).toEqual({ email: MESSAGES.invalidEmail });
  });

  it("rejects an e-mail longer than 254 characters (CB10)", () => {
    const suffix = "@empresa.com";
    expect(registerErrors({ email: "a".repeat(255 - suffix.length) + suffix })).toEqual({
      email: MESSAGES.invalidEmail,
    });
  });

  it("enforces password length 8..100 (CA05, CB05, CB06)", () => {
    expect(registerErrors({ password: "1234567", confirmPassword: "1234567" })).toEqual({
      password: MESSAGES.passwordTooShort,
    });
    expect(validateRegister({ ...VALID, password: "12345678", confirmPassword: "12345678" }).success).toBe(true);
    const long = "x".repeat(101);
    expect(registerErrors({ password: long, confirmPassword: long })).toEqual({ password: MESSAGES.passwordTooLong });
  });

  it("rejects a different confirmation (CA06)", () => {
    expect(registerErrors({ confirmPassword: "senha54321" })).toEqual({ confirmPassword: MESSAGES.passwordMismatch });
  });

  it("sends the password exactly as typed, spaces included (RN05, CB07)", () => {
    const password = " senha 12345 ";
    const result = validateRegister({ ...VALID, password, confirmPassword: password });
    expect(result.success && result.data.password).toBe(password);
  });

  it("enforces name length 2..100 (RN04, CB04)", () => {
    expect(registerErrors({ name: "A" })).toEqual({ name: MESSAGES.nameLength });
    expect(registerErrors({ name: "a".repeat(101) })).toEqual({ name: MESSAGES.nameLength });
  });

  it("combines several errors in one pass (spec 2.1)", () => {
    expect(registerErrors({ name: "A", email: "x", confirmPassword: "outra" })).toEqual({
      name: MESSAGES.nameLength,
      email: MESSAGES.invalidEmail,
      confirmPassword: MESSAGES.passwordMismatch,
    });
  });
});

describe("validateLogin", () => {
  it("requires e-mail and password (CA14)", () => {
    expect(validateLogin({ email: "", password: "", rememberMe: true })).toEqual({
      success: false,
      fields: { email: MESSAGES.required, password: MESSAGES.required },
    });
  });

  it("normalizes the e-mail and keeps the password and rememberMe (CA10, CA13, RN10)", () => {
    expect(validateLogin({ email: " ANA@EMPRESA.COM ", password: "SENHA12345", rememberMe: false })).toEqual({
      success: true,
      data: { email: "ana@empresa.com", password: "SENHA12345", rememberMe: false },
    });
  });
});
