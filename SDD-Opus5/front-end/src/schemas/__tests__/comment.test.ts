import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/lib/messages";
import { COMMENT_BODY_MAX, validateCommentBody } from "../comment";

describe("validateCommentBody (RF09 RN03)", () => {
  it("normalizes and keeps inner line breaks (CA05, CA06, CA07)", () => {
    expect(validateCommentBody("  Pronto para revisão  ")).toEqual({ success: true, data: { body: "Pronto para revisão" } });
    expect(validateCommentBody("Linha 1\nLinha 2")).toEqual({ success: true, data: { body: "Linha 1\nLinha 2" } });
  });

  it.each(["", "   ", "\n \n"])("requires the text: %j (CA08)", (value) => {
    expect(validateCommentBody(value)).toEqual({ success: false, fields: { body: MESSAGES.required } });
  });

  it("accepts 2000 characters and rejects 2001, emoji counting as one (CA09, CB02)", () => {
    expect(COMMENT_BODY_MAX).toBe(2000);
    expect(validateCommentBody("a".repeat(2000)).success).toBe(true);
    expect(validateCommentBody("😀".repeat(2000)).success).toBe(true);
    expect(validateCommentBody("a".repeat(2001))).toEqual({ success: false, fields: { body: MESSAGES.commentTooLong } });
  });
});
