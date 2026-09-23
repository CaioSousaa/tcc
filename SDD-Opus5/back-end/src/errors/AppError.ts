import { MESSAGES } from "./messages";

export type ErrorCode =
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
  | "INTERNAL_ERROR";

export type FieldErrors = Record<string, string>;

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: MESSAGES.validationFailed,
  EMAIL_ALREADY_EXISTS: MESSAGES.emailAlreadyExists,
  INVALID_CREDENTIALS: MESSAGES.invalidCredentials,
  UNAUTHENTICATED: MESSAGES.unauthenticated,
  SESSION_EXPIRED: MESSAGES.sessionExpired,
  BOARD_NOT_FOUND: MESSAGES.boardNotFound,
  LIST_NOT_FOUND: MESSAGES.listNotFound,
  LIST_DELETION_LOCKED: MESSAGES.listDeletionLocked,
  LIST_DELETION_STRATEGY_REQUIRED: MESSAGES.listDeletionStrategyRequired,
  LIST_CARD_COUNT_CHANGED: MESSAGES.listCardCountChanged,
  TARGET_LIST_NOT_FOUND: MESSAGES.targetListNotFound,
  CHECKLIST_ITEM_NOT_FOUND: MESSAGES.checklistItemNotFound,
  CHECKLIST_LIMIT_REACHED: MESSAGES.checklistLimitReached,
  CARD_NOT_FOUND: MESSAGES.cardNotFound,
  FORBIDDEN: MESSAGES.forbidden,
  LAST_ADMIN: MESSAGES.lastAdmin,
  ALREADY_MEMBER: MESSAGES.alreadyMember,
  INVITATION_ALREADY_PENDING: MESSAGES.invitationAlreadyPending,
  MEMBER_LIMIT_REACHED: MESSAGES.memberLimitReached,
  INVITATION_NOT_FOUND: MESSAGES.invitationNotFound,
  MEMBER_NOT_FOUND: MESSAGES.memberNotFound,
  ASSIGNEE_NOT_MEMBER: MESSAGES.assigneeNotMember,
  LABEL_NOT_FOUND: MESSAGES.labelNotFound,
  LABEL_NAME_TAKEN: MESSAGES.labelNameTaken,
  LABEL_LIMIT_REACHED: MESSAGES.labelLimitReached,
  COMMENT_NOT_FOUND: MESSAGES.commentNotFound,
  COMMENT_LIMIT_REACHED: MESSAGES.commentLimitReached,
  INTERNAL_ERROR: MESSAGES.unexpected,
};

/** Domain error. Carries no HTTP knowledge; the error handler maps codes to status. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fields: FieldErrors | undefined;

  constructor(code: ErrorCode, fields?: FieldErrors) {
    super(DEFAULT_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
    this.fields = code === "VALIDATION_ERROR" ? fields : undefined;
  }
}

/** Raised by the data layer when a unique constraint is violated. */
export class UniqueConstraintError extends Error {
  readonly constraint: string | undefined;

  constructor(constraint?: string) {
    super("Unique constraint violation");
    this.name = "UniqueConstraintError";
    this.constraint = constraint;
  }
}
