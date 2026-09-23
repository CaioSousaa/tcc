import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/lib/messages";
import { LIST_NAME_MAX, validateListForm } from "../list";

describe("validateListForm", () => {
  it("accepts a valid name and position", () => {
    expect(validateListForm({ name: "Revisão", position: 3 })).toEqual({
      success: true,
      data: { name: "Revisão", position: 3 },
    });
  });

  it.each(["", "   "])("requires the name (CA11, CA25): %j", (name) => {
    expect(validateListForm({ name, position: 1 })).toEqual({ success: false, fields: { name: MESSAGES.required } });
  });

  it("accepts 50 characters and rejects 51 (CA12, CB02, CB03)", () => {
    expect(LIST_NAME_MAX).toBe(50);
    expect(validateListForm({ name: "a".repeat(50), position: 1 }).success).toBe(true);
    expect(validateListForm({ name: "a".repeat(51), position: 1 })).toEqual({
      success: false,
      fields: { name: MESSAGES.listNameTooLong },
    });
  });

  it("trims only the ends (CA13, CB06)", () => {
    const result = validateListForm({ name: "  Em   progresso  ", position: 1 });
    expect(result.success && result.data.name).toBe("Em   progresso");
  });

  it("counts emoji as one character (RN03, CB04)", () => {
    expect(validateListForm({ name: "🚀".repeat(50), position: 1 }).success).toBe(true);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects position %s (CB09)", (position) => {
    expect(validateListForm({ name: "X", position })).toEqual({
      success: false,
      fields: { position: MESSAGES.invalidPosition },
    });
  });
});
