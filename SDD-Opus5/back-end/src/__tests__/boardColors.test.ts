import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BOARD_COLORS, DEFAULT_BOARD_COLOR, isBoardColor } from "../domain/boardColors";

describe("board palette", () => {
  it("has exactly five colors in display order (RN06, spec glossary)", () => {
    expect(BOARD_COLORS).toEqual(["navy", "blue", "green", "amber", "purple"]);
  });

  it("defaults to navy (RN06, CA07)", () => {
    expect(DEFAULT_BOARD_COLOR).toBe("navy");
  });

  it("rejects anything outside the palette (CB08)", () => {
    for (const value of ["red", "#1d3355", "NAVY", "", null, undefined, 1]) {
      expect(isBoardColor(value)).toBe(false);
    }
  });

  it("matches the CHECK constraint of the migration (C42)", () => {
    const migration = readFileSync(
      join(__dirname, "..", "migrations", "1760000001000-CreateBoardsListsCards.ts"),
      "utf8",
    );
    const match = migration.match(/"color" IN \(([^)]*)\)/);
    const keys = match?.[1]?.split(",").map((key) => key.trim().replace(/'/g, ""));
    expect(keys).toEqual([...BOARD_COLORS]);
  });
});
