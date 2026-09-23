import { describe, expect, it } from "vitest";
import { COMMENTS_MAX, COMMENT_BODY_MAX, normalizeCommentBody } from "../domain/comments";

describe("comment domain (RF09)", () => {
  it("has the limits of RN03 and RN08", () => {
    expect(COMMENT_BODY_MAX).toBe(2000);
    expect(COMMENTS_MAX).toBe(500);
  });

  it("turns CR LF and lone CR into LF (2.4, CB01)", () => {
    expect(normalizeCommentBody("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("trims spaces and line breaks at the ends only (2.4, CA06)", () => {
    expect(normalizeCommentBody("  \n Pronto para revisão \n ")).toBe("Pronto para revisão");
    expect(normalizeCommentBody("Passos:\n\n1.  abrir")).toBe("Passos:\n\n1.  abrir");
  });
});
