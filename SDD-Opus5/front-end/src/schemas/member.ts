import { MESSAGES } from "@/lib/messages";
import { EMAIL_MAX, normalizeEmail, type ValidationResult } from "./auth";

// Same rule as RF01 (RF07 A57); the API remains the authority.
const EMAIL_PATTERN = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/;

export type InviteField = "email";

export function validateInviteEmail(email: string): ValidationResult<{ email: string }, InviteField> {
  if (email.trim().length === 0) return { success: false, fields: { email: MESSAGES.required } };
  const normalized = normalizeEmail(email);
  if (normalized.length > EMAIL_MAX || !EMAIL_PATTERN.test(normalized)) {
    return { success: false, fields: { email: MESSAGES.invalidEmail } };
  }
  return { success: true, data: { email: normalized } };
}
