import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/lib/messages";
import { validateBoardForm, type BoardFormValues } from "../board";

const VALID: BoardFormValues = { name: "Sprint 13", color: "purple", withDefaultLists: true, lockListDeletion: false };

describe("validateBoardForm", () => {
  it("accepts valid data (CA09)", () => {
    expect(validateBoardForm(VALID)).toEqual({ success: true, data: VALID });
  });

  it.each(["", "   "])("requires the name (CA12, CA27): %j", (name) => {
    expect(validateBoardForm({ ...VALID, name })).toEqual({ success: false, fields: { name: MESSAGES.required } });
  });

  it("rejects 61 characters and accepts 60 (CA13, CB02, CB03)", () => {
    expect(validateBoardForm({ ...VALID, name: "a".repeat(61) })).toEqual({
      success: false,
      fields: { name: MESSAGES.boardNameTooLong },
    });
    expect(validateBoardForm({ ...VALID, name: "a".repeat(60) }).success).toBe(true);
  });

  it("trims only the ends (CA14, CB04, CB07)", () => {
    const result = validateBoardForm({ ...VALID, name: "  Sprint   13  " });
    expect(result.success && result.data.name).toBe("Sprint   13");
  });

  it("counts emoji as one character each (CB05)", () => {
    expect(validateBoardForm({ ...VALID, name: "🚀".repeat(60) }).success).toBe(true);
  });

  it("rejects a color outside the palette (CB08)", () => {
    const values = { ...VALID, color: "red" } as unknown as BoardFormValues;
    expect(validateBoardForm(values)).toEqual({ success: false, fields: { color: MESSAGES.invalidColor } });
  });

  it("keeps the deletion lock choice untouched (RF05 CA03)", () => {
    const result = validateBoardForm({ ...VALID, lockListDeletion: true });
    expect(result.success && result.data.lockListDeletion).toBe(true);
  });

  it("keeps the default-lists choice untouched (CA10)", () => {
    const result = validateBoardForm({ ...VALID, withDefaultLists: false });
    expect(result.success && result.data.withDefaultLists).toBe(false);
  });

  it("uses the messages of spec 5.4", () => {
    expect(MESSAGES.boardNameTooLong).toBe("O nome do quadro deve ter no máximo 60 caracteres.");
    expect(MESSAGES.invalidColor).toBe("Selecione uma cor válida.");
    expect(MESSAGES.boardNotFound).toBe("Quadro não encontrado.");
    expect(MESSAGES.noBoards).toBe("Você ainda não tem quadros. Crie o primeiro para começar.");
  });
});
