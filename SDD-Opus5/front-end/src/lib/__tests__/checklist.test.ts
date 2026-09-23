import { describe, expect, it } from "vitest";
import type { BoardDetail } from "@/services/boardService";
import type { ApiError } from "../api";
import {
  checklistFailureAction,
  checklistProgress,
  faceAccessibleName,
  faceLabel,
  sectionLabel,
  summarize,
  withCardChecklist,
} from "../checklist";
import { MESSAGES } from "../messages";

describe("checklistProgress (RN09, C131)", () => {
  it.each([
    [2, 4, 50],
    [2, 3, 66],
    [1, 3, 33],
    [99, 100, 99],
    [0, 1, 0],
    [4, 4, 100],
    [2, 5, 40],
  ])("%i of %i is %i%%, rounded down (CA01, CA06, CA08, CA10, CA19)", (done, total, percent) => {
    expect(checklistProgress(done, total)?.percent).toBe(percent);
  });

  it("has no progress without items (CA02, CA04, CA28)", () => {
    expect(checklistProgress(0, 0)).toBeNull();
  });

  it("is complete only when every item is done (CA05, CB12)", () => {
    expect(checklistProgress(5, 5)?.complete).toBe(true);
    expect(checklistProgress(99, 100)?.complete).toBe(false);
    expect(checklistProgress(1, 1)).toEqual({ done: 1, total: 1, percent: 100, complete: true });
  });
});

describe("labels (spec 5.4)", () => {
  const half = checklistProgress(2, 4);
  if (!half) throw new Error("progress expected");

  it("formats the section, face and accessible name", () => {
    expect(sectionLabel(half)).toBe("2/4 concluídos · 50%");
    expect(faceLabel(half)).toBe("2/4");
    expect(faceAccessibleName(half)).toBe("Checklist: 2 de 4 itens concluídos (50%)");
  });

  it("uses the section texts of the spec", () => {
    expect(MESSAGES.checklistTitle).toBe("Checklist");
    expect(MESSAGES.checklistEmpty).toBe("Nenhum item ainda.");
    expect(MESSAGES.checklistAdd).toBe("+ Adicionar item");
    expect(MESSAGES.checklistFieldLabel).toBe("Texto do item");
    expect(MESSAGES.checklistItemTooLong).toBe("O item deve ter no máximo 200 caracteres.");
    expect(MESSAGES.checklistItemNotFound).toBe("Item não encontrado.");
    expect(MESSAGES.checklistLimitReached).toBe("A checklist pode ter no máximo 100 itens.");
  });
});

describe("summarize", () => {
  it("counts done and total items (RN10)", () => {
    expect(summarize([{ done: true }, { done: false }, { done: true }])).toEqual({ done: 2, total: 3 });
    expect(summarize([])).toEqual({ done: 0, total: 0 });
  });
});

describe("withCardChecklist (spec 2.6, C133)", () => {
  const card = (id: string, total = 0, done = 0) => ({ id, title: id, position: 1, checklistTotal: total, checklistDone: done, assigneeIds: [] as string[], labelIds: [] as string[], commentCount: 0, dueDate: null });
  const board: BoardDetail = {
    id: "b",
    name: "Sprint",
    color: "navy",
    listCount: 2,
    cardCount: 2,
    lockListDeletion: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    myRole: "admin",
    memberCount: 1,
    memberPreview: [],
  overdueCount: 0,
    members: [],
    labels: [],
    lists: [
      { id: "l1", name: "Em progresso", position: 1, cardCount: 1, cards: [card("refatorar", 4, 2)] },
      { id: "l2", name: "Concluído", position: 2, cardCount: 1, cards: [card("outro")] },
    ],
  };

  it("updates only the counts of that card (CA08, CA17, CA27)", () => {
    const next = withCardChecklist(board, "refatorar", { done: 3, total: 4 });
    expect(next.lists[0]?.cards[0]).toMatchObject({ checklistTotal: 4, checklistDone: 3 });
    expect(next.lists[1]).toBe(board.lists[1]);
    expect(next.cardCount).toBe(board.cardCount);
  });

  it("does not mutate the previous state", () => {
    const copy = structuredClone(board);
    withCardChecklist(board, "refatorar", { done: 0, total: 0 });
    expect(board).toEqual(copy);
  });

  it("returns the same board when the card is not on it", () => {
    expect(withCardChecklist(board, "missing", { done: 1, total: 1 })).toBe(board);
  });
});

describe("checklistFailureAction (plan F74)", () => {
  const error = (code: ApiError["code"]): ApiError => ({ code, message: "x", fields: {} });

  it.each(["add", "toggle", "edit", "remove"] as const)("delegates a missing board or card on %s (CA34, CA38)", (operation) => {
    expect(checklistFailureAction(operation, error("BOARD_NOT_FOUND"))).toBe("card-gone");
    expect(checklistFailureAction(operation, error("CARD_NOT_FOUND"))).toBe("card-gone");
  });

  it("shows the message and reloads when toggling or editing a missing item (CA36, CB17)", () => {
    expect(checklistFailureAction("toggle", error("CHECKLIST_ITEM_NOT_FOUND"))).toBe("reload-with-message");
    expect(checklistFailureAction("edit", error("CHECKLIST_ITEM_NOT_FOUND"))).toBe("reload-with-message");
  });

  it("reloads silently when removing a missing item (RN14, CB18)", () => {
    expect(checklistFailureAction("remove", error("CHECKLIST_ITEM_NOT_FOUND"))).toBe("reload-silently");
  });

  it("keeps field errors next to the add or edit field (CA11, CA12, CA24, CB10, CE01)", () => {
    for (const code of ["VALIDATION_ERROR", "CHECKLIST_LIMIT_REACHED", "NETWORK_ERROR"] as const) {
      expect(checklistFailureAction("add", error(code))).toBe("show-in-field");
      expect(checklistFailureAction("edit", error(code))).toBe("show-in-field");
    }
  });

  it("shows toggle and remove failures in the section (CE02)", () => {
    expect(checklistFailureAction("toggle", error("NETWORK_ERROR"))).toBe("show-in-section");
    expect(checklistFailureAction("remove", error("INTERNAL_ERROR"))).toBe("show-in-section");
  });
});
