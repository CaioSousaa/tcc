import { describe, expect, it } from "vitest";
import type { BoardListItem } from "@/services/boardService";
import { deletionQuery } from "@/services/listService";
import type { ApiError } from "../api";
import {
  canConfirm,
  cascadeWarning,
  deletionSummary,
  initialDecision,
  listDeletionFailureAction,
  reconcileDecision,
  suggestedTarget,
  targetOptions,
  toDecision,
} from "../listDeletion";
import { MESSAGES } from "../messages";

const list = (id: string, name: string, position: number, cardCount: number): BoardListItem => ({
  id,
  name,
  position,
  cardCount,
  cards: Array.from({ length: cardCount }, (_, i) => ({
    id: `${id}-${i}`,
    title: `${name}${i + 1}`,
    position: i + 1,
    checklistTotal: 0,
    checklistDone: 0,
    assigneeIds: [],
    labelIds: [],
    commentCount: 0,
    dueDate: null,
  })),
});

// Board of spec section 3.
const SPRINT = [list("b", "Backlog", 1, 0), list("a", "A fazer", 2, 3), list("r", "Revisão", 3, 4), list("c", "Concluído", 4, 1)];

describe("targetOptions", () => {
  it("offers every other list in board order (CA07)", () => {
    expect(targetOptions(SPRINT, "r").map((l) => l.name)).toEqual(["Backlog", "A fazer", "Concluído"]);
  });

  it("orders by position even when the input is not sorted", () => {
    expect(targetOptions([...SPRINT].reverse(), "r").map((l) => l.name)).toEqual(["Backlog", "A fazer", "Concluído"]);
  });
});

describe("suggestedTarget", () => {
  it("suggests the list to the right (CA07, CA09)", () => {
    expect(suggestedTarget(SPRINT, "r")).toBe("c");
    expect(suggestedTarget(SPRINT, "a")).toBe("r");
  });

  it("suggests the list to the left for the last list (CA08)", () => {
    expect(suggestedTarget(SPRINT, "c")).toBe("r");
  });

  it("has no suggestion for the only list (CA10)", () => {
    expect(suggestedTarget([list("u", "Única", 1, 2)], "u")).toBeNull();
  });
});

describe("initialDecision and canConfirm", () => {
  it("preselects move to the suggested list and allows confirming (CA07, CA22)", () => {
    const draft = initialDecision(SPRINT, "r", false);
    expect(draft).toEqual({ choice: "move", targetListId: "c" });
    expect(canConfirm(draft, false, true)).toBe(true);
  });

  it("preselects nothing for the only list; confirming needs cascade (CA10, RN01)", () => {
    const draft = initialDecision([list("u", "Única", 1, 2)], "u", false);
    expect(draft).toEqual({ choice: null, targetListId: null });
    expect(canConfirm(draft, false, false)).toBe(false);
    expect(canConfirm({ choice: "cascade", targetListId: null }, false, false)).toBe(true);
  });

  it("never allows confirming with the lock on (CA19)", () => {
    expect(initialDecision(SPRINT, "r", true)).toEqual({ choice: null, targetListId: null });
    expect(canConfirm({ choice: "cascade", targetListId: null }, true, true)).toBe(false);
    expect(canConfirm({ choice: "move", targetListId: "c" }, true, true)).toBe(false);
  });

  it("does not allow move without a destination", () => {
    expect(canConfirm({ choice: "move", targetListId: null }, false, true)).toBe(false);
  });
});

describe("toDecision", () => {
  it("sends the count the user saw (RN08, C112)", () => {
    expect(toDecision({ choice: "move", targetListId: "c" }, 4)).toEqual({ strategy: "move", targetListId: "c", expectedCardCount: 4 });
    expect(toDecision({ choice: "cascade", targetListId: "c" }, 5)).toEqual({ strategy: "cascade", expectedCardCount: 5 });
    expect(toDecision({ choice: null, targetListId: null }, 4)).toBeNull();
  });
});

describe("reconcileDecision after a reload (F60)", () => {
  it("replaces a destination deleted elsewhere by the suggestion (CA26)", () => {
    const withoutConcluido = SPRINT.filter((l) => l.id !== "c");
    expect(reconcileDecision({ choice: "move", targetListId: "c" }, withoutConcluido, "r", false)).toEqual({
      choice: "move",
      targetListId: "a",
    });
  });

  it("keeps an existing destination and a cascade choice", () => {
    expect(reconcileDecision({ choice: "move", targetListId: "b" }, SPRINT, "r", false)).toEqual({ choice: "move", targetListId: "b" });
    expect(reconcileDecision({ choice: "cascade", targetListId: null }, SPRINT, "r", false)).toEqual({ choice: "cascade", targetListId: null });
  });

  it("clears the choice when the lock was turned on elsewhere (CA25)", () => {
    expect(reconcileDecision({ choice: "cascade", targetListId: null }, SPRINT, "r", true)).toEqual({ choice: null, targetListId: null });
  });
});

describe("listDeletionFailureAction (plan F61)", () => {
  const error = (code: ApiError["code"]): ApiError => ({ code, message: "x", fields: {} });

  it("closes and reloads when the list is gone (CA27, RN12)", () => {
    expect(listDeletionFailureAction(error("LIST_NOT_FOUND"))).toBe("close-and-reload");
  });

  it("shows BoardNotFound for a missing board (CA29)", () => {
    expect(listDeletionFailureAction(error("BOARD_NOT_FOUND"))).toBe("board-not-found");
  });

  it.each(["LIST_CARD_COUNT_CHANGED", "LIST_DELETION_LOCKED", "TARGET_LIST_NOT_FOUND"] as const)(
    "keeps the dialog and reloads on %s (CA23, CA25, CA26)",
    (code) => {
      expect(listDeletionFailureAction(error(code))).toBe("stay-and-reload");
    },
  );

  it.each(["VALIDATION_ERROR", "LIST_DELETION_STRATEGY_REQUIRED", "NETWORK_ERROR", "INTERNAL_ERROR"] as const)(
    "keeps the dialog on %s (CA31, CE01)",
    (code) => {
      expect(listDeletionFailureAction(error(code))).toBe("stay");
    },
  );
});

describe("texts (spec 5.5)", () => {
  it("formats the summary and cascade warning with singular", () => {
    expect(deletionSummary(4)).toBe("Ela contém 4 cards. Escolha o que deve acontecer com eles.");
    expect(deletionSummary(1)).toBe("Ela contém 1 card. Escolha o que deve acontecer com eles.");
    expect(cascadeWarning(4)).toBe("Ação irreversível: 4 cards e todo o seu conteúdo serão apagados.");
    expect(cascadeWarning(1)).toBe("Ação irreversível: 1 card e todo o seu conteúdo serão apagados.");
  });

  it("uses the option and notice texts of the spec", () => {
    expect(MESSAGES.deletionMoveTitle).toBe("Mover os cards para outra lista");
    expect(MESSAGES.deletionMoveHint).toBe("Recomendado. Nenhum card é perdido.");
    expect(MESSAGES.deletionMoveUnavailable).toBe("Não há outra lista neste quadro para receber os cards.");
    expect(MESSAGES.deletionCascadeTitle).toBe("Excluir a lista e todos os cards");
    expect(MESSAGES.deletionBlockTitle).toBe("Bloquear exclusão enquanto houver cards");
    expect(MESSAGES.deletionBlockHint).toBe("Regra definida nas configurações do quadro.");
    expect(MESSAGES.lockListDeletionOption).toBe("Bloquear exclusão de listas que contêm cards");
    expect(MESSAGES.deletionLockedNotice).toBe(
      "A exclusão de listas com cards está bloqueada neste quadro. Mova ou exclua os cards antes, ou desative o bloqueio em Editar quadro.",
    );
  });
});

describe("deletionQuery (C115)", () => {
  it("builds move parameters", () => {
    expect(deletionQuery({ strategy: "move", targetListId: "c", expectedCardCount: 4 }).toString()).toBe(
      "strategy=move&expectedCardCount=4&targetListId=c",
    );
  });

  it("builds cascade parameters without a target", () => {
    expect(deletionQuery({ strategy: "cascade", expectedCardCount: 1 }).toString()).toBe("strategy=cascade&expectedCardCount=1");
  });

  it("encodes unsafe characters", () => {
    expect(deletionQuery({ strategy: "move", targetListId: "a&b=c", expectedCardCount: 1 }).get("targetListId")).toBe("a&b=c");
  });
});
