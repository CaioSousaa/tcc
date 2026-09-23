import {
  CARD_DESCRIPTION_MAX,
  CARD_TITLE_MAX,
  characterCount,
  normalizeCardTitle,
  normalizeDescription,
} from "../domain/cards";
import { isValidDueDate } from "../domain/dueDate";
import type { FieldErrors } from "../errors/AppError";
import { MESSAGES } from "../errors/messages";
import type { ParseResult } from "./auth.schemas";

export type CreateCardInput = { title: string };

export type UpdateCardInput = {
  title: string;
  description: string | null;
  listId: string | undefined;
  position: number | undefined;
  /** `null` means no due date; always present in the request (RF10 F136). */
  dueDate: string | null;
};

function toObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

function parseTitle(input: unknown, fields: FieldErrors): string | undefined {
  if (typeof input !== "string") {
    fields.title = MESSAGES.required;
    return undefined;
  }
  const title = normalizeCardTitle(input);
  if (title.length === 0) {
    fields.title = MESSAGES.required;
    return undefined;
  }
  if (characterCount(title) > CARD_TITLE_MAX) {
    fields.title = MESSAGES.cardTitleTooLong;
    return undefined;
  }
  return title;
}

/** Absent or null means empty, not "keep": the dialog always sends the full form (A38). */
function parseDescription(input: unknown, fields: FieldErrors): string | null {
  if (input === undefined || input === null) return null;
  if (typeof input !== "string") {
    fields.description = MESSAGES.invalidValue;
    return null;
  }
  const description = normalizeDescription(input);
  if (description !== null && characterCount(description) > CARD_DESCRIPTION_MAX) {
    fields.description = MESSAGES.descriptionTooLong;
    return null;
  }
  return description;
}

function parsePosition(input: unknown, fields: FieldErrors): number | undefined {
  if (input === undefined || input === null) return undefined;
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 1) {
    fields.position = MESSAGES.invalidPosition;
    return undefined;
  }
  return input;
}

/** A malformed id string is not a validation error: it resolves to LIST_NOT_FOUND later (A41, C71). */
function parseListId(input: unknown, fields: FieldErrors): string | undefined {
  if (input === undefined || input === null) return undefined;
  if (typeof input !== "string") {
    fields.listId = MESSAGES.invalidValue;
    return undefined;
  }
  return input;
}

/** Required: `null` or a valid `YYYY-MM-DD`; absence is refused, never read as "keep" or "remove" (RF10 F136, CB05–CB07). */
function parseDueDate(raw: Record<string, unknown>, fields: FieldErrors): string | null {
  if (!Object.prototype.hasOwnProperty.call(raw, "dueDate")) {
    fields.dueDate = MESSAGES.invalidDate;
    return null;
  }
  const input = raw.dueDate;
  if (input === null) return null;
  if (!isValidDueDate(input)) {
    fields.dueDate = MESSAGES.invalidDate;
    return null;
  }
  return input;
}

/** Only the title is read; position, description and anything else are dropped (CB10). */
export function parseCreateCardInput(body: unknown): ParseResult<CreateCardInput> {
  const fields: FieldErrors = {};
  const title = parseTitle(toObject(body).title, fields);
  if (title === undefined) return { success: false, fields };
  return { success: true, data: { title } };
}

export function parseUpdateCardInput(body: unknown): ParseResult<UpdateCardInput> {
  const raw = toObject(body);
  const fields: FieldErrors = {};

  const title = parseTitle(raw.title, fields);
  const description = parseDescription(raw.description, fields);
  const listId = parseListId(raw.listId, fields);
  const position = parsePosition(raw.position, fields);
  const dueDate = parseDueDate(raw, fields);

  if (title === undefined || Object.keys(fields).length > 0) return { success: false, fields };
  return { success: true, data: { title, description, listId, position, dueDate } };
}
