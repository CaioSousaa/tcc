import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/lib/messages";
import { validateCardForm, validateNewCard } from "../card";

const FORM = { title: "C1", description: "", listId: "a-fazer", position: 1, dueDate: "" };

describe("validateNewCard", () => {
  it("normalizes and accepts a title (CA06, CA10, CA11)", () => {
    expect(validateNewCard({ title: "  Linha 1\nLinha 2 " })).toEqual({ success: true, data: { title: "Linha 1 Linha 2" } });
  });

  it.each(["", "   ", "\n"])("requires the title (CA08): %j", (title) => {
    expect(validateNewCard({ title })).toEqual({ success: false, fields: { title: MESSAGES.required } });
  });

  it("rejects 201 characters and accepts 200 (CA09, CB02, CB03)", () => {
    expect(validateNewCard({ title: "a".repeat(200) }).success).toBe(true);
    expect(validateNewCard({ title: "a".repeat(201) })).toEqual({
      success: false,
      fields: { title: MESSAGES.cardTitleTooLong },
    });
  });
});

describe("validateCardForm", () => {
  it("builds the payload with an empty description as null (CA19, CA21)", () => {
    expect(validateCardForm({ ...FORM, title: " Tarefa 1 ", description: "  " })).toEqual({
      success: true,
      data: { title: "Tarefa 1", description: null, listId: "a-fazer", position: 1, dueDate: null },
    });
  });

  it("keeps multi-line descriptions (CA20)", () => {
    const result = validateCardForm({ ...FORM, description: "Linha 1\nLinha 2" });
    expect(result.success && result.data.description).toBe("Linha 1\nLinha 2");
  });

  it("reports title and description errors at once, so nothing is sent (CA22, CA23)", () => {
    expect(validateCardForm({ ...FORM, title: "", description: "d".repeat(5001), listId: "concluido" })).toEqual({
      success: false,
      fields: { title: MESSAGES.required, description: MESSAGES.descriptionTooLong },
    });
  });

  it("accepts a 5000-character description (CB07)", () => {
    expect(validateCardForm({ ...FORM, description: "d".repeat(5000) }).success).toBe(true);
  });

  it("rejects an invalid position (CB09)", () => {
    expect(validateCardForm({ ...FORM, position: 0 })).toEqual({
      success: false,
      fields: { position: MESSAGES.invalidPosition },
    });
  });
});

describe("validateCardForm with due date (RF10 2.2)", () => {
  it("sends null for an empty field and the date otherwise (CA08, CA11)", () => {
    const empty = validateCardForm({ ...FORM, dueDate: "" });
    expect(empty.success && empty.data.dueDate).toBeNull();
    const dated = validateCardForm({ ...FORM, dueDate: "2026-09-10" });
    expect(dated.success && dated.data.dueDate).toBe("2026-09-10");
  });

  it("accepts past dates (CA13)", () => {
    expect(validateCardForm({ ...FORM, dueDate: "2026-08-01" }).success).toBe(true);
  });

  it.each(["2026-04-31", "1999-01-01", "2100-01-01"])("refuses %s so nothing is saved (CA14, CB02, CB03)", (dueDate) => {
    expect(validateCardForm({ ...FORM, dueDate })).toEqual({ success: false, fields: { dueDate: MESSAGES.invalidDate } });
  });

  it("refuses an incomplete date reported by the input as empty (CB04, F149)", () => {
    expect(validateCardForm({ ...FORM, dueDate: "", dueDateBadInput: true })).toEqual({
      success: false,
      fields: { dueDate: MESSAGES.invalidDate },
    });
  });

  it("reports an invalid title and due date together (CA15)", () => {
    expect(validateCardForm({ ...FORM, title: "", dueDate: "2026-04-31" })).toEqual({
      success: false,
      fields: { title: MESSAGES.required, dueDate: MESSAGES.invalidDate },
    });
  });
});
