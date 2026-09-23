import { isBoardColor, type BoardColor } from "../domain/boardColors";
import { BOARD_NAME_MAX } from "../domain/boards";
import { isCalendarDate } from "../domain/dueDate";
import type { FieldErrors } from "../errors/AppError";
import { MESSAGES } from "../errors/messages";
import type { ParseResult } from "./auth.schemas";

export type CreateBoardInput = { name: string; color: BoardColor; withDefaultLists: boolean };
export type UpdateBoardInput = { name: string; color: BoardColor; lockListDeletion?: boolean | undefined };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function toObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

/** Trims the ends only; inner spaces are kept as typed (RN04, CB07). */
function parseName(input: unknown, fields: FieldErrors): string | undefined {
  if (typeof input !== "string" || input.trim().length === 0) {
    fields.name = MESSAGES.required;
    return undefined;
  }
  const name = input.trim();
  // Counted in Unicode code points, matching char_length() in PostgreSQL.
  if (Array.from(name).length > BOARD_NAME_MAX) {
    fields.name = MESSAGES.boardNameTooLong;
    return undefined;
  }
  return name;
}

function parseColor(input: unknown, fields: FieldErrors): BoardColor | undefined {
  if (!isBoardColor(input)) {
    fields.color = MESSAGES.invalidColor;
    return undefined;
  }
  return input;
}

/** Unknown fields (ownerId, createdAt, ...) are never copied to the result (CB10). */
export function parseCreateBoardInput(body: unknown): ParseResult<CreateBoardInput> {
  const raw = toObject(body);
  const fields: FieldErrors = {};

  const name = parseName(raw.name, fields);
  const color = parseColor(raw.color, fields);

  let withDefaultLists = true; // absent means checked (CB09)
  if (raw.withDefaultLists !== undefined && raw.withDefaultLists !== null) {
    if (typeof raw.withDefaultLists === "boolean") withDefaultLists = raw.withDefaultLists;
    else fields.withDefaultLists = MESSAGES.invalidValue;
  }

  if (name === undefined || color === undefined || Object.keys(fields).length > 0) {
    return { success: false, fields };
  }
  return { success: true, data: { name, color, withDefaultLists } };
}

export function parseUpdateBoardInput(body: unknown): ParseResult<UpdateBoardInput> {
  const raw = toObject(body);
  const fields: FieldErrors = {};

  const name = parseName(raw.name, fields);
  const color = parseColor(raw.color, fields);

  // Optional: absent keeps the current value; present must be a boolean (RF05 CB08, CB09).
  let lockListDeletion: boolean | undefined;
  if (raw.lockListDeletion !== undefined && raw.lockListDeletion !== null) {
    if (typeof raw.lockListDeletion === "boolean") lockListDeletion = raw.lockListDeletion;
    else fields.lockListDeletion = MESSAGES.invalidValue;
  }

  if (name === undefined || color === undefined || Object.keys(fields).length > 0) return { success: false, fields };
  return { success: true, data: { name, color, lockListDeletion } };
}

/** `today` of the viewer's device; `null` when absent, falling back to the database date (RF10 F139, A69). */
export type TodayQuery = { today: string | null };

export function parseTodayQuery(query: unknown): ParseResult<TodayQuery> {
  const raw = toObject(query).today;
  if (raw === undefined) return { success: true, data: { today: null } };
  if (!isCalendarDate(raw)) return { success: false, fields: { today: MESSAGES.invalidDate } };
  return { success: true, data: { today: raw } };
}
