import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/lib/messages";
import { CHECKLIST_ITEM_TEXT_MAX, validateChecklistText } from "../checklist";

describe("validateChecklistText (RN04)", () => {
  it("accepts and normalizes (CA08, CA13)", () => {
    expect(validateChecklistText("  Revisar   PR  ")).toEqual({ success: true, data: { text: "Revisar   PR" } });
    expect(validateChecklistText("Linha 1\nLinha 2")).toEqual({ success: true, data: { text: "Linha 1 Linha 2" } });
  });

  it.each(["", "   ", "\n \r\n"])("requires the text: %j (CA11, CA24, CB04)", (value) => {
    expect(validateChecklistText(value)).toEqual({ success: false, fields: { text: MESSAGES.required } });
  });

  it("accepts 200 characters and rejects 201 (CA12, CB02, CB03)", () => {
    expect(CHECKLIST_ITEM_TEXT_MAX).toBe(200);
    expect(validateChecklistText("a".repeat(200)).success).toBe(true);
    expect(validateChecklistText("a".repeat(201))).toEqual({ success: false, fields: { text: MESSAGES.checklistItemTooLong } });
  });

  it("counts emoji as one character (CB05)", () => {
    expect(validateChecklistText("🚀".repeat(200)).success).toBe(true);
  });
});
