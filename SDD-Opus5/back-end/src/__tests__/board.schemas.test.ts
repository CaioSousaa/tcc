import { describe, expect, it } from "vitest";
import { MESSAGES } from "../errors/messages";
import { isUuid, parseCreateBoardInput, parseUpdateBoardInput } from "../schemas/board.schemas";

function createFields(body: unknown) {
  const result = parseCreateBoardInput(body);
  if (result.success) throw new Error("expected validation failure");
  return result.fields;
}

describe("parseCreateBoardInput", () => {
  it("accepts name, color and the default-lists option (CA09)", () => {
    expect(parseCreateBoardInput({ name: "Sprint 13", color: "purple", withDefaultLists: true })).toEqual({
      success: true,
      data: { name: "Sprint 13", color: "purple", withDefaultLists: true },
    });
  });

  it("honours withDefaultLists false (CA10)", () => {
    const result = parseCreateBoardInput({ name: "Sprint 13", color: "navy", withDefaultLists: false });
    expect(result.success && result.data.withDefaultLists).toBe(false);
  });

  it("treats a missing withDefaultLists as checked (CB09)", () => {
    const result = parseCreateBoardInput({ name: "Sprint 13", color: "navy" });
    expect(result.success && result.data.withDefaultLists).toBe(true);
  });

  it("rejects a non-boolean withDefaultLists", () => {
    expect(createFields({ name: "A", color: "navy", withDefaultLists: "yes" })).toEqual({
      withDefaultLists: MESSAGES.invalidValue,
    });
  });

  it.each(["", "   ", undefined, null, 42])("requires the name: %s (CA12)", (name) => {
    expect(createFields({ name, color: "navy" })).toEqual({ name: MESSAGES.required });
  });

  it("trims only the ends of the name (CA14, CB04, CB07)", () => {
    const result = parseCreateBoardInput({ name: "  Sprint   13  ", color: "navy" });
    expect(result.success && result.data.name).toBe("Sprint   13");
  });

  it("accepts 1 and 60 characters and rejects 61 (CB01, CB02, CB03, CA13)", () => {
    expect(parseCreateBoardInput({ name: "A", color: "navy" }).success).toBe(true);
    expect(parseCreateBoardInput({ name: "a".repeat(60), color: "navy" }).success).toBe(true);
    expect(parseCreateBoardInput({ name: `  ${"a".repeat(60)}  `, color: "navy" }).success).toBe(true);
    expect(createFields({ name: "a".repeat(61), color: "navy" })).toEqual({ name: MESSAGES.boardNameTooLong });
  });

  it("counts emoji as single characters, like the database (CB02, CB05)", () => {
    const result = parseCreateBoardInput({ name: "🚀".repeat(60), color: "navy" });
    expect(result.success).toBe(true);
  });

  it("keeps accents, emoji, symbols and HTML literally (CB05, CB06)", () => {
    for (const name of ["Ômega · Sprint #2 🚀", "<script>alert(1)</script>"]) {
      const result = parseCreateBoardInput({ name, color: "navy" });
      expect(result.success && result.data.name).toBe(name);
    }
  });

  it.each([undefined, "", "red", "#1d3355", "NAVY"])("rejects color %s (CB08)", (color) => {
    expect(createFields({ name: "Alfa", color })).toEqual({ color: MESSAGES.invalidColor });
  });

  it("reports name and color errors together", () => {
    expect(createFields({})).toEqual({ name: MESSAGES.required, color: MESSAGES.invalidColor });
    expect(createFields(null)).toEqual({ name: MESSAGES.required, color: MESSAGES.invalidColor });
  });

  it("drops fields that are not part of the contract (CB10, RN01)", () => {
    const result = parseCreateBoardInput({ name: "Alfa", color: "navy", ownerId: "someone", createdAt: "2000-01-01" });
    expect(result.success && Object.keys(result.data).sort()).toEqual(["color", "name", "withDefaultLists"]);
  });
});

describe("parseUpdateBoardInput", () => {
  it("accepts name and color (CA24)", () => {
    expect(parseUpdateBoardInput({ name: "Ômega", color: "amber" })).toEqual({
      success: true,
      data: { name: "Ômega", color: "amber", lockListDeletion: undefined },
    });
  });

  it("accepts the list deletion lock and keeps it undefined when absent (RF05 CA03, CB09)", () => {
    const on = parseUpdateBoardInput({ name: "Sprint", color: "navy", lockListDeletion: true });
    expect(on.success && on.data.lockListDeletion).toBe(true);
    const off = parseUpdateBoardInput({ name: "Sprint", color: "navy", lockListDeletion: false });
    expect(off.success && off.data.lockListDeletion).toBe(false);
    const absent = parseUpdateBoardInput({ name: "Sprint", color: "navy" });
    expect(absent.success && absent.data.lockListDeletion).toBeUndefined();
  });

  it.each(["true", 1, {}, []])("rejects a non-boolean lock %j (RF05 CB08)", (lockListDeletion) => {
    expect(parseUpdateBoardInput({ name: "Sprint", color: "navy", lockListDeletion })).toEqual({
      success: false,
      fields: { lockListDeletion: MESSAGES.invalidValue },
    });
  });

  it("requires both name and color (plan A23)", () => {
    expect(parseUpdateBoardInput({ name: "Ômega" })).toEqual({
      success: false,
      fields: { color: MESSAGES.invalidColor },
    });
    expect(parseUpdateBoardInput({ color: "amber" })).toEqual({
      success: false,
      fields: { name: MESSAGES.required },
    });
  });

  it("rejects an empty name (CA27)", () => {
    expect(parseUpdateBoardInput({ name: "", color: "green" })).toEqual({
      success: false,
      fields: { name: MESSAGES.required },
    });
  });

  it("ignores withDefaultLists, owner and dates (CB10, RN08)", () => {
    const result = parseUpdateBoardInput({
      name: "Alfa",
      color: "blue",
      withDefaultLists: false,
      ownerId: "x",
      createdAt: "2000-01-01",
    });
    expect(result.success && Object.keys(result.data).sort()).toEqual(["color", "lockListDeletion", "name"]);
  });
});

describe("isUuid", () => {
  it("accepts UUIDs and rejects anything else (CA22, N30)", () => {
    expect(isUuid("7d1f2a57-4f7e-4a41-9d2c-2d8a7f7e1b10")).toBe(true);
    for (const value of ["123", "not-a-uuid", "7d1f2a57-4f7e-4a41-9d2c-2d8a7f7e1b1", "' OR 1=1 --", undefined]) {
      expect(isUuid(value)).toBe(false);
    }
  });
});
