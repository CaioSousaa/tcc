import { LIST_DELETION_STRATEGIES, type ListDeletionRequest, type ListDeletionStrategy } from "../domain/listDeletion";
import { LIST_NAME_MAX } from "../domain/lists";
import type { FieldErrors } from "../errors/AppError";
import { MESSAGES } from "../errors/messages";
import type { ParseResult } from "./auth.schemas";

export type CreateListInput = { name: string; position: number | undefined };
export type UpdateListInput = { name: string; position: number | undefined };

function toObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

/** Trims the ends only; counts Unicode code points like the board name (RN03). */
function parseName(input: unknown, fields: FieldErrors): string | undefined {
  if (typeof input !== "string" || input.trim().length === 0) {
    fields.name = MESSAGES.required;
    return undefined;
  }
  const name = input.trim();
  if (Array.from(name).length > LIST_NAME_MAX) {
    fields.name = MESSAGES.listNameTooLong;
    return undefined;
  }
  return name;
}

/**
 * Absent means "end of board" on create and "keep" on update (CB07, CB08).
 * Present must be a safe integer >= 1; the upper bound is applied by the service (RN09, CB09).
 */
function parsePosition(input: unknown, fields: FieldErrors): number | undefined {
  if (input === undefined || input === null) return undefined;
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 1) {
    fields.position = MESSAGES.invalidPosition;
    return undefined;
  }
  return input;
}

function parseListInput(body: unknown): ParseResult<CreateListInput> {
  const raw = toObject(body);
  const fields: FieldErrors = {};
  const name = parseName(raw.name, fields);
  const position = parsePosition(raw.position, fields);

  if (name === undefined || Object.keys(fields).length > 0) return { success: false, fields };
  // Only name and position leave the parser; boardId, createdAt, ... are dropped (CB10).
  return { success: true, data: { name, position } };
}

export const parseCreateListInput = parseListInput;
export const parseUpdateListInput: (body: unknown) => ParseResult<UpdateListInput> = parseListInput;

/** A repeated parameter arrives as an array and is invalid (RF05 A43). */
function singleValue(input: unknown): { present: boolean; value: string | undefined; valid: boolean } {
  if (input === undefined) return { present: false, value: undefined, valid: true };
  if (typeof input !== "string") return { present: true, value: undefined, valid: false };
  return { present: true, value: input, valid: true };
}

/**
 * Query of DELETE /api/boards/:boardId/lists/:listId (RF05 plan 4.1). Only the
 * format is checked here; board state is checked by the service (F56, C103).
 */
export function parseDeleteListQuery(query: unknown): ParseResult<ListDeletionRequest> {
  const raw = toObject(query);
  const fields: FieldErrors = {};

  const strategyParam = singleValue(raw.strategy);
  let strategy: ListDeletionStrategy | undefined;
  if (strategyParam.present) {
    if (strategyParam.valid && (LIST_DELETION_STRATEGIES as readonly string[]).includes(strategyParam.value ?? "")) {
      strategy = strategyParam.value as ListDeletionStrategy;
    } else {
      fields.strategy = MESSAGES.listDeletionStrategyRequired;
    }
  }

  const targetParam = singleValue(raw.targetListId);
  let targetListId: string | undefined;
  if (targetParam.present) {
    if (targetParam.valid && (targetParam.value ?? "").length > 0) targetListId = targetParam.value;
    else fields.targetListId = MESSAGES.targetListInvalid;
  }
  if (strategy === "move" && targetListId === undefined && fields.targetListId === undefined) {
    fields.targetListId = MESSAGES.targetListInvalid;
  }

  const countParam = singleValue(raw.expectedCardCount);
  let expectedCardCount: number | undefined;
  if (countParam.present) {
    const text = countParam.value ?? "";
    const value = /^\d+$/.test(text) ? Number(text) : Number.NaN;
    if (countParam.valid && Number.isSafeInteger(value)) expectedCardCount = value;
    else fields.expectedCardCount = MESSAGES.listDeletionStrategyRequired;
  }

  if (Object.keys(fields).length > 0) return { success: false, fields };
  return { success: true, data: { strategy, targetListId, expectedCardCount } };
}
