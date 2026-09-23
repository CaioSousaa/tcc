import { describe, expect, it } from "vitest";
import { CHECKLIST_ITEM_TEXT_MAX, CHECKLIST_MAX_ITEMS } from "../domain/checklist";
import { MESSAGES } from "../errors/messages";
import { parseCreateChecklistItemInput, parseUpdateChecklistItemInput } from "../schemas/checklist.schemas";

describe("parseCreateChecklistItemInput", () => {
  it("accepts a text (CA08)", () => {
    expect(parseCreateChecklistItemInput({ text: "Atualizar docs" })).toEqual({ success: true, data: { text: "Atualizar docs" } });
  });

  it("normalizes like the card title (CA13, D28)", () => {
    expect(parseCreateChecklistItemInput({ text: "  Revisar   PR  " })).toEqual({ success: true, data: { text: "Revisar   PR" } });
    expect(parseCreateChecklistItemInput({ text: "Linha 1\r\nLinha 2" })).toEqual({ success: true, data: { text: "Linha 1 Linha 2" } });
  });

  it.each(["", "   ", "\n\n", undefined, null, 7])("requires the text: %j (CA11, CB04)", (text) => {
    expect(parseCreateChecklistItemInput({ text })).toEqual({ success: false, fields: { text: MESSAGES.required } });
  });

  it("accepts 1 and 200 characters and rejects 201 (CB01–CB03, CA12)", () => {
    expect(CHECKLIST_ITEM_TEXT_MAX).toBe(200);
    expect(CHECKLIST_MAX_ITEMS).toBe(100);
    expect(parseCreateChecklistItemInput({ text: "A" }).success).toBe(true);
    expect(parseCreateChecklistItemInput({ text: "a".repeat(200) }).success).toBe(true);
    expect(parseCreateChecklistItemInput({ text: "a".repeat(201) })).toEqual({
      success: false,
      fields: { text: "O item deve ter no máximo 200 caracteres." },
    });
  });

  it("keeps HTML and emoji literally (CB05)", () => {
    const result = parseCreateChecklistItemInput({ text: "<b>🚀</b>" });
    expect(result.success && result.data.text).toBe("<b>🚀</b>");
  });

  it("drops position, done and card sent on creation (CB07)", () => {
    const result = parseCreateChecklistItemInput({ text: "X", done: true, position: 1, cardId: "other" });
    expect(result.success && Object.keys(result.data)).toEqual(["text"]);
  });
});

describe("parseUpdateChecklistItemInput", () => {
  it("accepts only done, the desired state (CA17, RN08)", () => {
    expect(parseUpdateChecklistItemInput({ done: true })).toEqual({ success: true, data: { text: undefined, done: true } });
    expect(parseUpdateChecklistItemInput({ done: false })).toEqual({ success: true, data: { text: undefined, done: false } });
  });

  it("accepts only text (CA22)", () => {
    expect(parseUpdateChecklistItemInput({ text: " Novo " })).toEqual({ success: true, data: { text: "Novo", done: undefined } });
  });

  it("requires text or done", () => {
    expect(parseUpdateChecklistItemInput({})).toEqual({ success: false, fields: { text: MESSAGES.required } });
  });

  it("rejects an empty text on edit (CA24)", () => {
    expect(parseUpdateChecklistItemInput({ text: "  " })).toEqual({ success: false, fields: { text: MESSAGES.required } });
  });

  it.each(["true", 1, 0, {}])("rejects a non-boolean done %j (CB06)", (done) => {
    expect(parseUpdateChecklistItemInput({ done })).toEqual({ success: false, fields: { done: MESSAGES.invalidValue } });
  });

  it("drops a card or position sent on update (CB08)", () => {
    const result = parseUpdateChecklistItemInput({ done: true, cardId: "other", position: 9 });
    expect(result.success && Object.keys(result.data).sort()).toEqual(["done", "text"]);
  });
});
