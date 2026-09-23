import { describe, expect, it } from "vitest";
import { DEFAULT_LABEL_COLOR, LABEL_COLORS, LABEL_COLOR_OPTIONS, isLabelColor, labelColorOption } from "../labelColors";

/** WCAG relative luminance of a #rrggbb color. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

describe("label palette (RF08 D37)", () => {
  it("has the same keys and order as the API", () => {
    expect(LABEL_COLORS).toEqual(["red", "blue", "green", "amber", "purple", "gray"]);
    expect(LABEL_COLOR_OPTIONS.map((option) => option.label)).toEqual(["Vermelho", "Azul", "Verde", "Âmbar", "Roxo", "Cinza"]);
  });

  it("pre-selects Vermelho (spec 2.4)", () => {
    expect(DEFAULT_LABEL_COLOR).toBe("red");
  });

  it("validates keys and falls back to gray for unknown values (N167)", () => {
    expect(isLabelColor("amber")).toBe(true);
    expect(isLabelColor("#ff0000")).toBe(false);
    expect(labelColorOption("javascript:alert(1)").key).toBe("gray");
  });

  it.each(LABEL_COLOR_OPTIONS.map((option) => [option.key, option] as const))(
    "keeps chip text contrast of at least 4.5:1 for %s (N175)",
    (_key, option) => {
      expect(contrast(option.text, option.background)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
