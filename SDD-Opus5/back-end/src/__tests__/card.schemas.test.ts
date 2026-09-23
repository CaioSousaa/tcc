import { describe, expect, it } from "vitest";
import { CARD_DESCRIPTION_MAX, CARD_TITLE_MAX, normalizeCardTitle, normalizeDescription } from "../domain/cards";
import { MESSAGES } from "../errors/messages";
import { parseCreateCardInput, parseUpdateCardInput } from "../schemas/card.schemas";

const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

function createFields(body: unknown) {
  const result = parseCreateCardInput(body);
  if (result.success) throw new Error("expected validation failure");
  return result.fields;
}

function updateFields(body: unknown) {
  const result = parseUpdateCardInput(body);
  if (result.success) throw new Error("expected validation failure");
  return result.fields;
}

describe("normalizeCardTitle (RN03, D26)", () => {
  it("trims the ends and keeps inner spaces (CA10)", () => {
    expect(normalizeCardTitle("  Revisar   PR  ")).toBe("Revisar   PR");
  });

  it("turns each line break into one space (CA11)", () => {
    expect(normalizeCardTitle("Linha 1\nLinha 2")).toBe("Linha 1 Linha 2");
    expect(normalizeCardTitle("Linha 1\r\nLinha 2")).toBe("Linha 1 Linha 2");
    expect(normalizeCardTitle("A\rB")).toBe("A B");
    expect(normalizeCardTitle(`A${LS}B${PS}C`)).toBe("A B C");
  });

  it("reduces a title made only of breaks and spaces to empty (CB04)", () => {
    expect(normalizeCardTitle(" \n \r\n ")).toBe("");
  });
});

describe("normalizeDescription (RN04, D21, D25)", () => {
  it("keeps inner line breaks and trims the ends (CA20)", () => {
    expect(normalizeDescription("\n  Linha 1\nLinha 2  \n")).toBe("Linha 1\nLinha 2");
  });

  it("normalizes CRLF and CR to LF", () => {
    expect(normalizeDescription("A\r\nB\rC")).toBe("A\nB\nC");
  });

  it("maps empty, whitespace-only and null to no description (CA21, CB08)", () => {
    for (const value of ["", "   ", "\n\n", null, undefined]) expect(normalizeDescription(value)).toBeNull();
  });
});

describe("parseCreateCardInput", () => {
  it("accepts a title (CA06)", () => {
    expect(parseCreateCardInput({ title: "C4" })).toEqual({ success: true, data: { title: "C4" } });
  });

  it.each(["", "   ", "\n", undefined, null, 5])("requires the title: %j (CA08, CB04)", (title) => {
    expect(createFields({ title })).toEqual({ title: MESSAGES.required });
  });

  it("accepts 1 and 200 characters and rejects 201 (CB01–CB03, CA09)", () => {
    expect(CARD_TITLE_MAX).toBe(200);
    expect(parseCreateCardInput({ title: "A" }).success).toBe(true);
    expect(parseCreateCardInput({ title: "a".repeat(200) }).success).toBe(true);
    expect(createFields({ title: "a".repeat(201) })).toEqual({
      title: "O título do card deve ter no máximo 200 caracteres.",
    });
  });

  it("counts emoji as one character (CB05)", () => {
    expect(parseCreateCardInput({ title: "🚀".repeat(200) }).success).toBe(true);
  });

  it("keeps HTML and Markdown literally (CB06)", () => {
    const result = parseCreateCardInput({ title: "<b>**x**</b>" });
    expect(result.success && result.data.title).toBe("<b>**x**</b>");
  });

  it("drops position, description and other fields (CB10, RN07)", () => {
    const result = parseCreateCardInput({ title: "C4", position: 1, description: "x", listId: "other" });
    expect(result.success && Object.keys(result.data)).toEqual(["title"]);
  });
});

describe("parseUpdateCardInput", () => {
  it("accepts the full form (CA32)", () => {
    expect(
      parseUpdateCardInput({ dueDate: null, title: " Iniciado ", description: " Passo\r\na passo ", listId: "l", position: 1 }),
    ).toEqual({
      success: true,
      data: { title: "Iniciado", description: "Passo\na passo", listId: "l", position: 1, dueDate: null },
    });
  });

  it("treats a missing description as empty (plan A38, CA21)", () => {
    const result = parseUpdateCardInput({ dueDate: null, title: "C2" });
    expect(result.success && result.data).toEqual({ title: "C2", description: null, listId: undefined, position: undefined, dueDate: null });
  });

  it("accepts exactly 5000 characters and rejects 5001 (CB07, CA23)", () => {
    expect(CARD_DESCRIPTION_MAX).toBe(5000);
    expect(parseUpdateCardInput({ dueDate: null, title: "C1", description: "d".repeat(5000) }).success).toBe(true);
    expect(parseUpdateCardInput({ dueDate: null, title: "C1", description: `  ${"d".repeat(5000)}\n` }).success).toBe(true);
    expect(updateFields({ dueDate: null, title: "C1", description: "d".repeat(5001) })).toEqual({
      description: "A descrição deve ter no máximo 5000 caracteres.",
    });
  });

  it("counts a CRLF as one character in the description limit (D25)", () => {
    const description = `${"d".repeat(2500)}\r\n${"d".repeat(2499)}`;
    expect(parseUpdateCardInput({ dueDate: null, title: "C1", description }).success).toBe(true);
  });

  it("reports title and description errors together, so nothing is saved (CA22)", () => {
    expect(updateFields({ dueDate: null, title: "", description: "d".repeat(5001), listId: "x", position: 1 })).toEqual({
      title: MESSAGES.required,
      description: MESSAGES.descriptionTooLong,
    });
  });

  it.each([0, -2, 1.5, "1", Number.MAX_SAFE_INTEGER + 1])("rejects position %j (CB09)", (position) => {
    expect(updateFields({ dueDate: null, title: "C1", position })).toEqual({ position: MESSAGES.invalidPosition });
  });

  it("rejects non-string description and listId", () => {
    expect(updateFields({ dueDate: null, title: "C1", description: 42, listId: 7 })).toEqual({
      description: MESSAGES.invalidValue,
      listId: MESSAGES.invalidValue,
    });
  });

  it("keeps a malformed listId string for the service to answer LIST_NOT_FOUND (plan A41)", () => {
    const result = parseUpdateCardInput({ dueDate: null, title: "C1", listId: "not-a-uuid" });
    expect(result.success && result.data.listId).toBe("not-a-uuid");
  });

  it("drops fields outside the contract (CB11, RN13)", () => {
    const result = parseUpdateCardInput({ dueDate: null, title: "C1", boardId: "b", createdAt: "2000-01-01", id: "x" });
    expect(result.success && Object.keys(result.data).sort()).toEqual(["description", "dueDate", "listId", "position", "title"]);
  });

  describe("dueDate (RF10 F136)", () => {
    it("accepts null and a valid date (CA08, CA11, CA13)", () => {
      expect(parseUpdateCardInput({ title: "C1", dueDate: null }).success && true).toBe(true);
      const result = parseUpdateCardInput({ title: "C1", dueDate: "2026-09-10" });
      expect(result.success && result.data.dueDate).toBe("2026-09-10");
    });

    it("accepts leap day and the range limits (CB01, CB03)", () => {
      for (const dueDate of ["2028-02-29", "2000-01-01", "2099-12-31"]) {
        expect(parseUpdateCardInput({ title: "C1", dueDate }).success).toBe(true);
      }
    });

    it.each([
      "2026-02-29",
      "2026-04-31",
      "2026-05-00",
      "2026-13-13",
      "1999-12-31",
      "2100-01-01",
      "2026-09-10T00:00:00Z",
      "10/09/2026",
      "",
      20260910,
      true,
    ])("rejects %j with 'Informe uma data válida.' (CA14, CB02–CB06)", (dueDate) => {
      expect(updateFields({ title: "C1", dueDate })).toEqual({ dueDate: "Informe uma data válida." });
    });

    it("rejects a request without dueDate instead of keeping or removing it (CB07)", () => {
      expect(updateFields({ title: "C1" })).toEqual({ dueDate: "Informe uma data válida." });
    });

    it("reports an invalid due date together with an invalid title (CA15)", () => {
      expect(updateFields({ title: "", dueDate: "2026-04-31" })).toEqual({
        title: MESSAGES.required,
        dueDate: "Informe uma data válida.",
      });
    });
  });
});
