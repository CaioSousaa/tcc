import { describe, expect, it } from "vitest";
import { clampPosition, LIST_NAME_MAX } from "../domain/lists";
import { MESSAGES } from "../errors/messages";
import { parseCreateListInput, parseUpdateListInput } from "../schemas/list.schemas";

function fields(body: unknown) {
  const result = parseCreateListInput(body);
  if (result.success) throw new Error("expected validation failure");
  return result.fields;
}

describe("parseCreateListInput / parseUpdateListInput", () => {
  it("accepts name and position (CA08)", () => {
    expect(parseCreateListInput({ name: "Revisão", position: 3 })).toEqual({
      success: true,
      data: { name: "Revisão", position: 3 },
    });
  });

  it("leaves position undefined when absent: end on create, keep on update (CB07, CB08)", () => {
    expect(parseCreateListInput({ name: "Arquivo" })).toEqual({ success: true, data: { name: "Arquivo", position: undefined } });
    expect(parseUpdateListInput({ name: "Fazendo", position: null })).toEqual({
      success: true,
      data: { name: "Fazendo", position: undefined },
    });
  });

  it.each(["", "   ", undefined, null, 7])("requires the name: %j (CA11, CA25)", (name) => {
    expect(fields({ name, position: 1 })).toEqual({ name: MESSAGES.required });
  });

  it("limits the name to 50 characters after trimming (CA12, CB01–CB03)", () => {
    expect(LIST_NAME_MAX).toBe(50);
    expect(parseCreateListInput({ name: "A" }).success).toBe(true);
    expect(parseCreateListInput({ name: `  ${"a".repeat(50)}  ` }).success).toBe(true);
    expect(fields({ name: "a".repeat(51) })).toEqual({ name: "O nome da lista deve ter no máximo 50 caracteres." });
  });

  it("counts emoji as one character, like the board name (RN03, CB04)", () => {
    expect(parseCreateListInput({ name: "🚀".repeat(50) }).success).toBe(true);
  });

  it("trims only the ends and keeps text literally (CA13, CB05, CB06)", () => {
    for (const [input, expected] of [
      ["  Revisão  ", "Revisão"],
      ["Em   progresso", "Em   progresso"],
      ["<b>x</b>", "<b>x</b>"],
    ]) {
      const result = parseCreateListInput({ name: input });
      expect(result.success && result.data.name).toBe(expected);
    }
  });

  it.each([0, -1, 1.5, "2", Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, true, {}])(
    "rejects position %j (CB09, A35)",
    (position) => {
      expect(fields({ name: "Revisão", position })).toEqual({ position: MESSAGES.invalidPosition });
    },
  );

  it("accepts a large position, clamped later by the service (RN09, CB13)", () => {
    expect(parseCreateListInput({ name: "Revisão", position: 999 })).toEqual({
      success: true,
      data: { name: "Revisão", position: 999 },
    });
  });

  it("reports name and position together", () => {
    expect(fields({ position: 0 })).toEqual({ name: MESSAGES.required, position: MESSAGES.invalidPosition });
  });

  it("drops fields outside the contract (CB10, RN13)", () => {
    const result = parseUpdateListInput({ name: "X", position: 2, boardId: "other", createdAt: "2000-01-01" });
    expect(result.success && Object.keys(result.data).sort()).toEqual(["name", "position"]);
  });
});

describe("clampPosition", () => {
  it.each([
    [1, 4, 1],
    [4, 4, 4],
    [5, 4, 4],
    [999, 3, 3],
  ])("clampPosition(%i, %i) = %i (RN09)", (requested, max, expected) => {
    expect(clampPosition(requested, max)).toBe(expected);
  });
});

describe("parseDeleteListQuery (RF05 plan 4.1)", () => {
  // Deferred import keeps this block self-contained.
  const parse = async (query: unknown) => (await import("../schemas/list.schemas")).parseDeleteListQuery(query);

  it("accepts no parameters, used for empty lists (RF03, C104)", async () => {
    expect(await parse({})).toEqual({
      success: true,
      data: { strategy: undefined, targetListId: undefined, expectedCardCount: undefined },
    });
  });

  it("accepts move with target and count (CA12)", async () => {
    expect(await parse({ strategy: "move", targetListId: "abc", expectedCardCount: "4" })).toEqual({
      success: true,
      data: { strategy: "move", targetListId: "abc", expectedCardCount: 4 },
    });
  });

  it("accepts cascade with a count and zero as a count (CA16, RN02)", async () => {
    expect(await parse({ strategy: "cascade", expectedCardCount: "0" })).toEqual({
      success: true,
      data: { strategy: "cascade", targetListId: undefined, expectedCardCount: 0 },
    });
  });

  it.each(["delete", "block", "MOVE", ""])("rejects unknown strategy %j (CB02)", async (strategy) => {
    expect(await parse({ strategy, expectedCardCount: "1" })).toEqual({
      success: false,
      fields: { strategy: "Escolha o que deve acontecer com os cards da lista." },
    });
  });

  it("requires a target for move (CB03)", async () => {
    expect(await parse({ strategy: "move", expectedCardCount: "1" })).toEqual({
      success: false,
      fields: { targetListId: "Selecione outra lista de destino." },
    });
  });

  it.each(["-1", "1.5", "abc", "", "9007199254740993"])("rejects count %j (CB06)", async (expectedCardCount) => {
    expect(await parse({ strategy: "cascade", expectedCardCount })).toEqual({
      success: false,
      fields: { expectedCardCount: "Escolha o que deve acontecer com os cards da lista." },
    });
  });

  it("rejects repeated parameters (A43)", async () => {
    expect(await parse({ strategy: ["move", "cascade"], targetListId: ["a", "b"], expectedCardCount: ["1", "2"] })).toEqual({
      success: false,
      fields: {
        strategy: "Escolha o que deve acontecer com os cards da lista.",
        targetListId: "Selecione outra lista de destino.",
        expectedCardCount: "Escolha o que deve acontecer com os cards da lista.",
      },
    });
  });

  it("leaves a malformed target id for the service (C103, CB04)", async () => {
    const result = await parse({ strategy: "move", targetListId: "not-a-uuid", expectedCardCount: "1" });
    expect(result.success && result.data.targetListId).toBe("not-a-uuid");
  });
});
