import { characterCount } from "./cards";

export const COMMENT_BODY_MAX = 2000;
export const COMMENTS_MAX = 500;

export type CommentView = {
  id: string;
  /** Account name, even when it no longer participates in the board (RF09 D45). */
  author: { userId: string; name: string };
  body: string;
  /** Publication moment; never changes (RN02). */
  createdAt: string;
  edited: boolean;
};

/** CR LF and lone CR become LF, then the ends are trimmed; inner whitespace is kept (RF09 2.4). */
export function normalizeCommentBody(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

export { characterCount };
