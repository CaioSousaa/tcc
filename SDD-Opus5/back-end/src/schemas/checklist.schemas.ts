import { CHECKLIST_ITEM_TEXT_MAX, characterCount, normalizeChecklistText } from "../domain/checklist";
import type { FieldErrors } from "../errors/AppError";
import { MESSAGES } from "../errors/messages";
import type { ParseResult } from "./auth.schemas";

export type CreateChecklistItemInput = { text: string };
export type UpdateChecklistItemInput = { text: string | undefined; done: boolean | undefined };

function toObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

function parseText(input: unknown, fields: FieldErrors): string | undefined {
  if (typeof input !== "string") {
    fields.text = MESSAGES.required;
    return undefined;
  }
  const text = normalizeChecklistText(input);
  if (text.length === 0) {
    fields.text = MESSAGES.required;
    return undefined;
  }
  if (characterCount(text) > CHECKLIST_ITEM_TEXT_MAX) {
    fields.text = MESSAGES.checklistItemTooLong;
    return undefined;
  }
  return text;
}

/** Only the text is read: position, done or card sent by the client are dropped (CB07). */
export function parseCreateChecklistItemInput(body: unknown): ParseResult<CreateChecklistItemInput> {
  const fields: FieldErrors = {};
  const text = parseText(toObject(body).text, fields);
  if (text === undefined) return { success: false, fields };
  return { success: true, data: { text } };
}

/** `text` and/or `done`; at least one is required (RF06 plan 4.4). Other fields are dropped (CB08). */
export function parseUpdateChecklistItemInput(body: unknown): ParseResult<UpdateChecklistItemInput> {
  const raw = toObject(body);
  const fields: FieldErrors = {};

  const hasText = raw.text !== undefined && raw.text !== null;
  const hasDone = raw.done !== undefined && raw.done !== null;
  if (!hasText && !hasDone) return { success: false, fields: { text: MESSAGES.required } };

  const text = hasText ? parseText(raw.text, fields) : undefined;

  let done: boolean | undefined;
  if (hasDone) {
    if (typeof raw.done === "boolean") done = raw.done;
    else fields.done = MESSAGES.invalidValue;
  }

  if (Object.keys(fields).length > 0) return { success: false, fields };
  return { success: true, data: { text, done } };
}
