import { z } from "zod";
import type { FieldErrors } from "../errors/AppError";
import { MESSAGES } from "../errors/messages";

export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 100;

// Non-empty local part, "@", domain with at least one dot, suffix with 2+ chars (RN03).
export const EMAIL_PATTERN = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/;

type Check<T> = { ok: true; value: T } | { ok: false; message: string };

/** Wraps a field check so that each field reports at most one message. */
function field<T>(check: (input: unknown) => Check<T>) {
  return z.unknown().transform((input, ctx) => {
    const result = check(input);
    if (result.ok) return result.value;
    ctx.addIssue({ code: "custom", message: result.message });
    return z.NEVER;
  });
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isBlank(input: unknown): boolean {
  return typeof input !== "string" || input.trim().length === 0;
}

const nameField = field<string>((input) => {
  if (isBlank(input)) return { ok: false, message: MESSAGES.required };
  const value = (input as string).trim();
  if (value.length < NAME_MIN || value.length > NAME_MAX) {
    return { ok: false, message: MESSAGES.nameLength };
  }
  return { ok: true, value };
});

const emailField = field<string>((input) => {
  if (isBlank(input)) return { ok: false, message: MESSAGES.required };
  const value = normalizeEmail(input as string);
  if (value.length > EMAIL_MAX || !EMAIL_PATTERN.test(value)) {
    return { ok: false, message: MESSAGES.invalidEmail };
  }
  return { ok: true, value };
});

// Passwords are never trimmed (RN05); whitespace-only is treated as empty (CB01).
const newPasswordField = field<string>((input) => {
  if (isBlank(input)) return { ok: false, message: MESSAGES.required };
  const value = input as string;
  if (value.length < PASSWORD_MIN) return { ok: false, message: MESSAGES.passwordTooShort };
  if (value.length > PASSWORD_MAX) return { ok: false, message: MESSAGES.passwordTooLong };
  return { ok: true, value };
});

const requiredRawString = field<string>((input) => {
  if (isBlank(input)) return { ok: false, message: MESSAGES.required };
  return { ok: true, value: input as string };
});

const rememberMeField = field<boolean>((input) => {
  if (input === undefined || input === null) return { ok: true, value: true };
  if (typeof input !== "boolean") return { ok: false, message: MESSAGES.invalidValue };
  return { ok: true, value: input };
});

const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: newPasswordField,
  confirmPassword: requiredRawString,
});

const loginSchema = z.object({
  email: emailField,
  password: requiredRawString,
  rememberMe: rememberMeField,
});

export type RegisterInput = { name: string; email: string; password: string };
export type LoginInput = { email: string; password: string; rememberMe: boolean };

export type ParseResult<T> = { success: true; data: T } | { success: false; fields: FieldErrors };

function toObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

function collectFields(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && fields[key] === undefined) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

/**
 * Validates and normalizes a sign-up payload. Every invalid field is reported
 * at once (CA07), including the password confirmation mismatch (CA06).
 */
export function parseRegisterInput(body: unknown): ParseResult<RegisterInput> {
  const raw = toObject(body);
  const result = registerSchema.safeParse(raw);
  const fields = result.success ? {} : collectFields(result.error);

  if (
    fields.confirmPassword === undefined &&
    !isBlank(raw.confirmPassword) &&
    raw.confirmPassword !== raw.password
  ) {
    fields.confirmPassword = MESSAGES.passwordMismatch;
  }

  if (!result.success || Object.keys(fields).length > 0) {
    return { success: false, fields };
  }

  const { name, email, password } = result.data;
  return { success: true, data: { name, email, password } };
}

export function parseLoginInput(body: unknown): ParseResult<LoginInput> {
  const result = loginSchema.safeParse(toObject(body));
  if (!result.success) return { success: false, fields: collectFields(result.error) };
  return { success: true, data: result.data };
}
