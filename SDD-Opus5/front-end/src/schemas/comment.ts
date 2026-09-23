import { characterCount } from "@/lib/cardText";
import { normalizeCommentBody } from "@/lib/comments";
import { MESSAGES } from "@/lib/messages";
import type { ValidationResult } from "./auth";

export const COMMENT_BODY_MAX = 2000;

/** Client-side mirror of RN03; the API remains the authority. */
export function validateCommentBody(value: string): ValidationResult<{ body: string }, "body"> {
  const body = normalizeCommentBody(value);
  if (body.length === 0) return { success: false, fields: { body: MESSAGES.required } };
  if (characterCount(body) > COMMENT_BODY_MAX) return { success: false, fields: { body: MESSAGES.commentTooLong } };
  return { success: true, data: { body } };
}
