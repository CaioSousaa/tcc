import type { ErrorRequestHandler } from "express";
import { AppError, type ErrorCode, type FieldErrors } from "../errors/AppError";

export const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  EMAIL_ALREADY_EXISTS: 409,
  INVALID_CREDENTIALS: 401,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  BOARD_NOT_FOUND: 404,
  LIST_NOT_FOUND: 404,
  LIST_DELETION_LOCKED: 409,
  LIST_DELETION_STRATEGY_REQUIRED: 409,
  LIST_CARD_COUNT_CHANGED: 409,
  TARGET_LIST_NOT_FOUND: 409,
  CHECKLIST_ITEM_NOT_FOUND: 404,
  CHECKLIST_LIMIT_REACHED: 409,
  CARD_NOT_FOUND: 404,
  FORBIDDEN: 403,
  LAST_ADMIN: 409,
  ALREADY_MEMBER: 409,
  INVITATION_ALREADY_PENDING: 409,
  MEMBER_LIMIT_REACHED: 409,
  INVITATION_NOT_FOUND: 404,
  MEMBER_NOT_FOUND: 404,
  ASSIGNEE_NOT_MEMBER: 409,
  LABEL_NOT_FOUND: 404,
  LABEL_NAME_TAKEN: 409,
  LABEL_LIMIT_REACHED: 409,
  COMMENT_NOT_FOUND: 404,
  COMMENT_LIMIT_REACHED: 409,
  INTERNAL_ERROR: 500,
};

export type ErrorBody = {
  error: { code: ErrorCode; message: string; fields?: FieldErrors };
};

export type ErrorLogger = (message: string, error: unknown) => void;

type BodyParserError = { type?: unknown; status?: unknown };

function bodyParserType(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const type = (error as BodyParserError).type;
  return typeof type === "string" ? type : undefined;
}

export function toErrorResponse(error: unknown): { status: number; body: ErrorBody } {
  if (error instanceof AppError) {
    const body: ErrorBody = { error: { code: error.code, message: error.message } };
    if (error.code === "VALIDATION_ERROR" && error.fields) body.error.fields = error.fields;
    return { status: STATUS_BY_CODE[error.code], body };
  }

  const parserType = bodyParserType(error);
  if (parserType === "entity.too.large") {
    return { status: 413, body: toErrorResponse(new AppError("VALIDATION_ERROR")).body };
  }
  if (parserType === "entity.parse.failed") {
    return toErrorResponse(new AppError("VALIDATION_ERROR"));
  }

  return toErrorResponse(new AppError("INTERNAL_ERROR"));
}

const defaultLogger: ErrorLogger = (message, error) => console.error(message, error);

/**
 * Central error translator. The response never carries internal details (CE04);
 * the request body is never logged, so passwords never reach the logs (N5, N6).
 */
export function errorHandler(log: ErrorLogger = defaultLogger): ErrorRequestHandler {
  return (error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const { status, body } = toErrorResponse(error);
    if (status >= 500) log(`[${req.method} ${req.path}] unexpected error`, error);
    res.status(status).json(body);
  };
}
