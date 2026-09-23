import { describe, expect, it } from "vitest";
import { parseCommentInput } from "../schemas/comment.schemas";

describe("parseCommentInput (RF09 plan 4.4)", () => {
  it("normalizes the text (CA06, CB01)", () => {
    expect(parseCommentInput({ body: "  Linha 1\r\nLinha 2  " })).toEqual({ success: true, data: { body: "Linha 1\nLinha 2" } });
  });

  it.each([{ body: "" }, { body: " \n\t " }, {}, { body: 42 }, null])("requires the text: %j (CA08, CB08)", (payload) => {
    expect(parseCommentInput(payload)).toEqual({ success: false, fields: { body: "Campo obrigatório." } });
  });

  it("accepts 2000 characters, emoji and line breaks counting as one, and rejects 2001 (CA09, CB02)", () => {
    expect(parseCommentInput({ body: "a".repeat(2000) }).success).toBe(true);
    expect(parseCommentInput({ body: `${"🚀".repeat(1000)}${"b\n".repeat(499)}b` }).success).toBe(true);
    expect(parseCommentInput({ body: "a".repeat(2001) })).toEqual({
      success: false,
      fields: { body: "O comentário deve ter no máximo 2000 caracteres." },
    });
  });

  it("keeps HTML as plain text (CB03)", () => {
    expect(parseCommentInput({ body: "<b>oi</b>" })).toEqual({ success: true, data: { body: "<b>oi</b>" } });
  });

  it("drops author, moment, card and edited flag (CB05)", () => {
    const result = parseCommentInput({ body: "Ok", authorId: "x", createdAt: "2000-01-01", cardId: "y", edited: true });
    expect(result.success && Object.keys(result.data)).toEqual(["body"]);
  });
});
