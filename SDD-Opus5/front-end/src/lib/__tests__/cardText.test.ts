import { describe, expect, it } from "vitest";
import { CARD_DESCRIPTION_MAX, CARD_TITLE_MAX, characterCount, normalizeCardTitle, normalizeDescription } from "../cardText";

describe("normalizeCardTitle (RN03)", () => {
  it("trims the ends and preserves inner spaces (CA10)", () => {
    expect(normalizeCardTitle("  Revisar   PR  ")).toBe("Revisar   PR");
  });

  it("replaces each line break with one space (CA11)", () => {
    expect(normalizeCardTitle("Linha 1\nLinha 2")).toBe("Linha 1 Linha 2");
    expect(normalizeCardTitle("Linha 1\r\nLinha 2")).toBe("Linha 1 Linha 2");
    expect(normalizeCardTitle(`A${String.fromCharCode(0x2028)}B`)).toBe("A B");
  });

  it("empties a title made of breaks and spaces (CB04)", () => {
    expect(normalizeCardTitle("\n  \r\n")).toBe("");
  });
});

describe("normalizeDescription (RN04)", () => {
  it("keeps inner line breaks (CA20)", () => {
    expect(normalizeDescription("  Linha 1\r\nLinha 2\n")).toBe("Linha 1\nLinha 2");
  });

  it("returns null for empty content (CA21, CB08)", () => {
    expect(normalizeDescription("")).toBeNull();
    expect(normalizeDescription(" \n\t ")).toBeNull();
  });
});

describe("limits", () => {
  it("match the spec and count emoji as one character", () => {
    expect(CARD_TITLE_MAX).toBe(200);
    expect(CARD_DESCRIPTION_MAX).toBe(5000);
    expect(characterCount("🚀é")).toBe(2);
  });
});
