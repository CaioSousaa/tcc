import axios, { AxiosError, type AxiosInstance } from "axios";
import { MESSAGES } from "./messages";

declare module "axios" {
  interface AxiosRequestConfig {
    /** When true, a 401 is handled by the caller instead of the global session handler. */
    skipSessionHandler?: boolean;
  }
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "UNAUTHENTICATED"
  | "SESSION_EXPIRED"
  | "BOARD_NOT_FOUND"
  | "LIST_NOT_FOUND"
  | "LIST_DELETION_LOCKED"
  | "LIST_DELETION_STRATEGY_REQUIRED"
  | "LIST_CARD_COUNT_CHANGED"
  | "TARGET_LIST_NOT_FOUND"
  | "CHECKLIST_ITEM_NOT_FOUND"
  | "CHECKLIST_LIMIT_REACHED"
  | "CARD_NOT_FOUND"
  | "FORBIDDEN"
  | "LAST_ADMIN"
  | "ALREADY_MEMBER"
  | "INVITATION_ALREADY_PENDING"
  | "MEMBER_LIMIT_REACHED"
  | "INVITATION_NOT_FOUND"
  | "MEMBER_NOT_FOUND"
  | "ASSIGNEE_NOT_MEMBER"
  | "LABEL_NOT_FOUND"
  | "LABEL_NAME_TAKEN"
  | "LABEL_LIMIT_REACHED"
  | "COMMENT_NOT_FOUND"
  | "COMMENT_LIMIT_REACHED"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  fields: Record<string, string>;
};

type ErrorEnvelope = { error?: { code?: unknown; message?: unknown; fields?: unknown } };

const API_CODES: readonly string[] = [
  "VALIDATION_ERROR",
  "EMAIL_ALREADY_EXISTS",
  "INVALID_CREDENTIALS",
  "UNAUTHENTICATED",
  "SESSION_EXPIRED",
  "BOARD_NOT_FOUND",
  "LIST_NOT_FOUND",
  "LIST_DELETION_LOCKED",
  "LIST_DELETION_STRATEGY_REQUIRED",
  "LIST_CARD_COUNT_CHANGED",
  "TARGET_LIST_NOT_FOUND",
  "CHECKLIST_ITEM_NOT_FOUND",
  "CHECKLIST_LIMIT_REACHED",
  "CARD_NOT_FOUND",
  "FORBIDDEN",
  "LAST_ADMIN",
  "ALREADY_MEMBER",
  "INVITATION_ALREADY_PENDING",
  "MEMBER_LIMIT_REACHED",
  "INVITATION_NOT_FOUND",
  "MEMBER_NOT_FOUND",
  "ASSIGNEE_NOT_MEMBER",
  "LABEL_NOT_FOUND",
  "LABEL_NAME_TAKEN",
  "LABEL_LIMIT_REACHED",
  "COMMENT_NOT_FOUND",
  "COMMENT_LIMIT_REACHED",
  "INTERNAL_ERROR",
];

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

/**
 * Turns any failure into a displayable error. Messages come from the API (A8);
 * without a usable response the generic message is used (CE01, CE04).
 */
export function toApiError(error: unknown): ApiError {
  if (!(error instanceof AxiosError) || !error.response) {
    return { code: "NETWORK_ERROR", message: MESSAGES.unexpected, fields: {} };
  }

  const envelope = (error.response.data ?? {}) as ErrorEnvelope;
  const code = envelope.error?.code;
  const message = envelope.error?.message;

  if (typeof code !== "string" || !API_CODES.includes(code) || typeof message !== "string") {
    return { code: "INTERNAL_ERROR", message: MESSAGES.unexpected, fields: {} };
  }

  const fields = envelope.error?.fields;
  return { code: code as ApiErrorCode, message, fields: isStringRecord(fields) ? fields : {} };
}

export function isSessionError(error: ApiError): boolean {
  return error.code === "SESSION_EXPIRED" || error.code === "UNAUTHENTICATED";
}

export const api: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"}/api`,
  // The session travels only in the HttpOnly cookie (A18, C01).
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

type SessionHandler = (error: ApiError) => void;
let sessionHandler: SessionHandler | undefined;

/** What happens when an authenticated action hits an invalid session (CB11, CB14). */
export function setSessionHandler(handler: SessionHandler | undefined): void {
  sessionHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 401 && !error.config?.skipSessionHandler) {
      const apiError = toApiError(error);
      if (isSessionError(apiError)) sessionHandler?.(apiError);
    }
    return Promise.reject(error);
  },
);
