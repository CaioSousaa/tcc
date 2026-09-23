import { describe, expect, it } from "vitest";
import type { ApiError } from "../api";
import { cardDialogEyebrow, cardFailureAction, deleteCardTitle } from "../cardsState";
import { MESSAGES } from "../messages";

const error = (code: ApiError["code"]): ApiError => ({ code, message: "x", fields: {} });

describe("cardFailureAction (plan F48)", () => {
  it.each(["create", "open", "save", "delete"] as const)("sends %s on a missing board to BoardNotFound (CB20, CA39)", (operation) => {
    expect(cardFailureAction(operation, error("BOARD_NOT_FOUND"))).toBe("board-not-found");
  });

  it("closes the add form and reloads when the list vanished (CB19)", () => {
    expect(cardFailureAction("create", error("LIST_NOT_FOUND"))).toBe("close-and-reload");
  });

  it("keeps the dialog and reloads when the destination list vanished (CB17, CA41)", () => {
    expect(cardFailureAction("save", error("LIST_NOT_FOUND"))).toBe("stay-and-reload");
  });

  it("closes and reloads when the card vanished while opening or saving (CB15, CA40)", () => {
    expect(cardFailureAction("open", error("CARD_NOT_FOUND"))).toBe("close-and-reload");
    expect(cardFailureAction("save", error("CARD_NOT_FOUND"))).toBe("close-and-reload");
  });

  it("treats a vanished card on delete as deleted (RN15, CB16, CA38)", () => {
    expect(cardFailureAction("delete", error("CARD_NOT_FOUND"))).toBe("deleted");
  });

  it("keeps forms and dialogs open for validation and communication failures (CE01–CE03)", () => {
    for (const operation of ["create", "open", "save", "delete"] as const) {
      for (const code of ["VALIDATION_ERROR", "NETWORK_ERROR", "INTERNAL_ERROR"] as const) {
        expect(cardFailureAction(operation, error(code))).toBe("stay");
      }
    }
  });
});

describe("texts (spec 5.4)", () => {
  it("builds the confirmation title and dialog caption", () => {
    expect(deleteCardTitle("C2")).toBe('Excluir o card "C2"?');
    expect(cardDialogEyebrow("A fazer")).toBe("CARD · A fazer");
  });

  it("uses the spec messages", () => {
    expect(MESSAGES.cardTitleTooLong).toBe("O título do card deve ter no máximo 200 caracteres.");
    expect(MESSAGES.descriptionTooLong).toBe("A descrição deve ter no máximo 5000 caracteres.");
    expect(MESSAGES.cardNotFound).toBe("Card não encontrado.");
    expect(MESSAGES.descriptionPlaceholder).toBe("Adicione uma descrição mais detalhada…");
    expect(MESSAGES.deleteCardBody).toBe("Esta ação não pode ser desfeita.");
  });
});
