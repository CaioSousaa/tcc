import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/lib/messages";
import { LABEL_NAME_MAX, validateLabelForm } from "../label";

describe("validateLabelForm (RF08 RN02, RN03)", () => {
  it("normalizes the name and keeps the color (CA06, CB01)", () => {
    expect(validateLabelForm({ name: "  UX  ", color: "purple" })).toEqual({ success: true, data: { name: "UX", color: "purple" } });
    expect(validateLabelForm({ name: "Front\nend", color: "blue" })).toEqual({ success: true, data: { name: "Front end", color: "blue" } });
  });

  it.each(["", "   "])("requires the name: %j (CA07)", (name) => {
    expect(validateLabelForm({ name, color: "red" })).toEqual({ success: false, fields: { name: MESSAGES.required } });
  });

  it("accepts 30 characters and rejects 31, emoji counting as one (CA08, CB02)", () => {
    expect(LABEL_NAME_MAX).toBe(30);
    expect(validateLabelForm({ name: "a".repeat(30), color: "red" }).success).toBe(true);
    expect(validateLabelForm({ name: "🚀".repeat(30), color: "red" }).success).toBe(true);
    expect(validateLabelForm({ name: "a".repeat(31), color: "red" })).toEqual({
      success: false,
      fields: { name: MESSAGES.labelNameTooLong },
    });
  });

  it("rejects colors outside the palette (CB03)", () => {
    expect(validateLabelForm({ name: "Bug", color: "pink" })).toEqual({ success: false, fields: { color: MESSAGES.invalidColor } });
  });
});
