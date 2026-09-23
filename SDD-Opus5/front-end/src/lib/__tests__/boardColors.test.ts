import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BOARD_COLORS, BOARD_COLOR_OPTIONS, DEFAULT_BOARD_COLOR, boardColorHex, isBoardColor } from "../boardColors";

const backEnd = resolve(process.cwd(), "..", "back-end", "src");

function quotedKeys(source: string, pattern: RegExp): string[] {
  const match = source.match(pattern);
  return (match?.[1] ?? "").split(",").map((key) => key.trim().replace(/["']/g, "")).filter(Boolean);
}

describe("board palette", () => {
  it("lists the five colors in display order with labels (spec glossary, N39)", () => {
    expect(BOARD_COLOR_OPTIONS.map((option) => [option.key, option.label])).toEqual([
      ["navy", "Azul-marinho"],
      ["blue", "Azul"],
      ["green", "Verde"],
      ["amber", "Âmbar"],
      ["purple", "Roxo"],
    ]);
  });

  it("defaults to navy (CA07)", () => {
    expect(DEFAULT_BOARD_COLOR).toBe("navy");
  });

  it("maps keys to the display colors of plan 3.5", () => {
    expect(boardColorHex("green")).toBe("#2e8b67");
    expect(isBoardColor("red")).toBe(false);
  });

  it("uses the same keys as the API and the migration CHECK (C42)", () => {
    const domain = readFileSync(resolve(backEnd, "domain", "boardColors.ts"), "utf8");
    const migration = readFileSync(resolve(backEnd, "migrations", "1760000001000-CreateBoardsListsCards.ts"), "utf8");

    expect(quotedKeys(domain, /BOARD_COLORS = \[([^\]]*)\]/)).toEqual([...BOARD_COLORS]);
    expect(quotedKeys(migration, /"color" IN \(([^)]*)\)/)).toEqual([...BOARD_COLORS]);
  });
});
