import { describe, expect, it } from "vitest";
import { parseLabelInput } from "../schemas/label.schemas";

describe("parseLabelInput (RF08 plan 4.5)", () => {
  it("normalizes the name and keeps the color (CA06)", () => {
    expect(parseLabelInput({ name: "  UX  ", color: "purple" })).toEqual({ success: true, data: { name: "UX", color: "purple" } });
  });

  it("requires the name (CA07)", () => {
    expect(parseLabelInput({ name: "   ", color: "red" })).toEqual({ success: false, fields: { name: "Campo obrigatório." } });
    expect(parseLabelInput({ color: "red" })).toEqual({ success: false, fields: { name: "Campo obrigatório." } });
  });

  it("accepts 30 characters and rejects 31, counting emoji as one (CA08, CB02)", () => {
    expect(parseLabelInput({ name: "a".repeat(30), color: "red" }).success).toBe(true);
    expect(parseLabelInput({ name: "🚀".repeat(30), color: "red" }).success).toBe(true);
    expect(parseLabelInput({ name: "a".repeat(31), color: "red" })).toEqual({
      success: false,
      fields: { name: "O nome da etiqueta deve ter no máximo 30 caracteres." },
    });
  });

  it("rejects colors outside the palette or missing (CB03)", () => {
    expect(parseLabelInput({ name: "Bug", color: "pink" })).toEqual({ success: false, fields: { color: "Selecione uma cor válida." } });
    expect(parseLabelInput({ name: "Bug" })).toEqual({ success: false, fields: { color: "Selecione uma cor válida." } });
  });

  it("reports every invalid field at once", () => {
    const result = parseLabelInput({});
    expect(result.success === false && Object.keys(result.fields).sort()).toEqual(["color", "name"]);
  });

  it("drops extra fields such as board, usage or dates (CB07)", () => {
    const result = parseLabelInput({ name: "Bug", color: "red", boardId: "x", usage: 9, createdAt: "2000-01-01" });
    expect(result.success && Object.keys(result.data).sort()).toEqual(["color", "name"]);
  });
});
