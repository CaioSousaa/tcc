import { describe, expect, it } from "vitest";
import type { ApiError } from "../api";
import { deleteListTitle, deletionDialogFor, listFailureAction } from "../listsState";
import { MESSAGES } from "../messages";

const error = (code: ApiError["code"]): ApiError => ({ code, message: "x", fields: {} });

describe("listFailureAction", () => {
  it.each(["create", "update", "delete"] as const)("sends %s on a missing board to BoardNotFound (CB17, CA35)", (operation) => {
    expect(listFailureAction(operation, error("BOARD_NOT_FOUND"))).toBe("board-not-found");
  });

  it("treats a missing list on delete as done and reloads (RN15, CB15, CA32)", () => {
    expect(listFailureAction("delete", error("LIST_NOT_FOUND"))).toBe("reload");
  });

  it("closes with a notice and reloads when editing a missing list (CB14, CA36)", () => {
    expect(listFailureAction("update", error("LIST_NOT_FOUND"))).toBe("reload-with-notice");
  });

  it("keeps the dialog open for validation and communication failures (CE01, CE02)", () => {
    for (const code of ["VALIDATION_ERROR", "NETWORK_ERROR", "INTERNAL_ERROR"] as const) {
      expect(listFailureAction("delete", error(code))).toBe("show-in-dialog");
    }
  });
});

describe("deletionDialogFor (RF05 C110)", () => {
  it("uses the simple confirmation for empty lists and the decision dialog otherwise (RF03 CA28, RF05 CA05, CA07)", () => {
    expect(deletionDialogFor({ cardCount: 0 })).toBe("simple");
    expect(deletionDialogFor({ cardCount: 1 })).toBe("decision");
    expect(deletionDialogFor({ cardCount: 4 })).toBe("decision");
  });
});

describe("texts", () => {
  it("match spec 5.4", () => {
    expect(deleteListTitle("Em progresso")).toBe('Excluir a lista "Em progresso"?');
    expect(MESSAGES.deleteListBody).toBe("Esta ação não pode ser desfeita.");
    expect(MESSAGES.noLists).toBe("Este quadro ainda não tem listas. Adicione a primeira para começar.");
    expect(MESSAGES.listNotFound).toBe("Lista não encontrada.");
  });
});
