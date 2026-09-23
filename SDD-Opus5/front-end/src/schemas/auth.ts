import { z } from "zod";
import { MESSAGES } from "@/lib/messages";

export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 100;

const EMAIL_PATTERN = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export type RegisterForm = { name: string; email: string; password: string; confirmPassword: string };
export type LoginForm = { email: string; password: string; rememberMe: boolean };

export type ValidationResult<T, K extends string> =
  | { success: true; data: T }
  | { success: false; fields: FieldErrors<K> };

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

const isBlank = (value: string) => value.trim().length === 0;

const nameSchema = z
  .string()
  .refine((v) => !isBlank(v), { message: MESSAGES.required, abort: true })
  .transform((v) => v.trim())
  .refine((v) => v.length >= NAME_MIN && v.length <= NAME_MAX, MESSAGES.nameLength);

const emailSchema = z
  .string()
  .refine((v) => !isBlank(v), { message: MESSAGES.required, abort: true })
  .transform(normalizeEmail)
  .refine((v) => v.length <= EMAIL_MAX && EMAIL_PATTERN.test(v), MESSAGES.invalidEmail);

function firstMessage(result: { success: false; error: z.ZodError }): string | undefined {
  return result.error.issues[0]?.message;
}

function passwordError(value: string): string | undefined {
  if (isBlank(value)) return MESSAGES.required;
  if (value.length < PASSWORD_MIN) return MESSAGES.passwordTooShort;
  if (value.length > PASSWORD_MAX) return MESSAGES.passwordTooLong;
  return undefined;
}

/**
 * Client-side mirror of the API rules, reporting every invalid field at once
 * (CA07). The API remains the authority (N8).
 */
export function validateRegister(form: RegisterForm): ValidationResult<RegisterForm, keyof RegisterForm> {
  const fields: FieldErrors<keyof RegisterForm> = {};

  const name = nameSchema.safeParse(form.name);
  if (!name.success) fields.name = firstMessage(name);

  const email = emailSchema.safeParse(form.email);
  if (!email.success) fields.email = firstMessage(email);

  const password = passwordError(form.password);
  if (password) fields.password = password;

  if (isBlank(form.confirmPassword)) fields.confirmPassword = MESSAGES.required;
  else if (form.confirmPassword !== form.password) fields.confirmPassword = MESSAGES.passwordMismatch;

  if (!name.success || !email.success || Object.keys(fields).length > 0) return { success: false, fields };

  // Passwords are sent exactly as typed (RN05).
  return {
    success: true,
    data: { name: name.data, email: email.data, password: form.password, confirmPassword: form.confirmPassword },
  };
}

export function validateLogin(form: LoginForm): ValidationResult<LoginForm, keyof LoginForm> {
  const fields: FieldErrors<keyof LoginForm> = {};

  const email = emailSchema.safeParse(form.email);
  if (!email.success) fields.email = firstMessage(email);
  if (isBlank(form.password)) fields.password = MESSAGES.required;

  if (!email.success || Object.keys(fields).length > 0) return { success: false, fields };
  return { success: true, data: { email: email.data, password: form.password, rememberMe: form.rememberMe } };
}
