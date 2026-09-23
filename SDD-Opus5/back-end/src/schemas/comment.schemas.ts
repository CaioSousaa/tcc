import { COMMENT_BODY_MAX, characterCount, normalizeCommentBody } from "../domain/comments";
import { MESSAGES } from "../errors/messages";
import type { ParseResult } from "./auth.schemas";

export type CommentInput = { body: string };

function toObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

/** Only the text is read: author, moment, card or edited flag sent by the client are dropped (RF09 CB05). */
export function parseCommentInput(payload: unknown): ParseResult<CommentInput> {
  const raw = toObject(payload).body;
  if (typeof raw !== "string") return { success: false, fields: { body: MESSAGES.required } };
  const body = normalizeCommentBody(raw);
  if (body.length === 0) return { success: false, fields: { body: MESSAGES.required } };
  if (characterCount(body) > COMMENT_BODY_MAX) return { success: false, fields: { body: MESSAGES.commentTooLong } };
  return { success: true, data: { body } };
}
