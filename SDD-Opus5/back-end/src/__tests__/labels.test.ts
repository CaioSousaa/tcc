import { describe, expect, it } from "vitest";
import { LABEL_COLORS, LABELS_MAX, LABEL_NAME_MAX, isLabelColor, labelNameKey, normalizeLabelName } from "../domain/labels";

describe("label domain (RF08)", () => {
  it("has the closed palette in display order (spec 'Paleta', D37)", () => {
    expect(LABEL_COLORS).toEqual(["red", "blue", "green", "amber", "purple", "gray"]);
    expect(isLabelColor("gray")).toBe(true);
    expect(isLabelColor("#ff0000")).toBe(false);
    expect(isLabelColor("navy")).toBe(false);
  });

  it("has the limits of RN03 and RN06", () => {
    expect(LABEL_NAME_MAX).toBe(30);
    expect(LABELS_MAX).toBe(50);
  });

  it("normalizes ends and line breaks, keeping inner spaces (RN03, CB01)", () => {
    expect(normalizeLabelName("  UX  ")).toBe("UX");
    expect(normalizeLabelName("Front\nend")).toBe("Front end");
    expect(normalizeLabelName("Em  revisão")).toBe("Em  revisão");
  });

  it("compares names without case but with accents (RN04, F105)", () => {
    expect(labelNameKey(" BUG ")).toBe(labelNameKey("bug"));
    expect(labelNameKey("Revisão")).not.toBe(labelNameKey("Revisao"));
  });
});
