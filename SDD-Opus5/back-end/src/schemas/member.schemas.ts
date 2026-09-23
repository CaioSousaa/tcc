import { type BoardRole, isBoardRole } from "../domain/permissions";
import type { FieldErrors } from "../errors/AppError";
import { MESSAGES } from "../errors/messages";
import { EMAIL_MAX, EMAIL_PATTERN, normalizeEmail, type ParseResult } from "./auth.schemas";

export type InviteInput = { email: string; role: BoardRole };
export type RoleInput = { role: BoardRole };

function toObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

/** Same rule as RF01: trimmed, lower case, then validated (RF07 CB01, CB02, A57). */
function parseEmail(input: unknown, fields: FieldErrors): string | undefined {
  if (typeof input !== "string" || input.trim().length === 0) {
    fields.email = MESSAGES.required;
    return undefined;
  }
  const email = normalizeEmail(input);
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    fields.email = MESSAGES.invalidEmail;
    return undefined;
  }
  return email;
}

/** Invitation: `role` absent means "member" (CB04); any other field is dropped. */
export function parseInviteInput(body: unknown): ParseResult<InviteInput> {
  const raw = toObject(body);
  const fields: FieldErrors = {};

  const email = parseEmail(raw.email, fields);

  let role: BoardRole = "member";
  if (raw.role !== undefined && raw.role !== null) {
    if (isBoardRole(raw.role)) role = raw.role;
    else fields.role = MESSAGES.invalidValue;
  }

  if (email === undefined || Object.keys(fields).length > 0) return { success: false, fields };
  return { success: true, data: { email, role } };
}

/** Role change of a participant or invitation: `role` is required (CB03). */
export function parseRoleInput(body: unknown): ParseResult<RoleInput> {
  const role = toObject(body).role;
  if (!isBoardRole(role)) return { success: false, fields: { role: MESSAGES.invalidValue } };
  return { success: true, data: { role } };
}
