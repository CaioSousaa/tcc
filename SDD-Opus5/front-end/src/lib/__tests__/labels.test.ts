import { describe, expect, it } from "vitest";
import type { BoardDetail, BoardListItem } from "@/services/boardService";
import type { LabelView } from "@/services/labelService";
import type { ApiError } from "../api";
import {
  NO_SELECTION,
  cardMatches,
  countCards,
  deleteLabelBody,
  deleteLabelTitle,
  filterLists,
  labelFailureAction,
  pruneSelection,
  resolveLabels,
  toggleSelection,
  visibleTotalLabel,
  withCardLabels,
  withLabels,
  withoutLabel,
} from "../labels";

const error = (code: ApiError["code"]): ApiError => ({ code, message: "x", fields: {} });

const BUG: LabelView = { id: "bug", name: "Bug", color: "red", usage: 1 };
const FRONT: LabelView = { id: "front", name: "Frontend", color: "blue", usage: 2 };
const URG: LabelView = { id: "urg", name: "Urgente", color: "amber", usage: 1 };

const card = (id: string, position: number, labelIds: string[]) => ({
  id,
  title: id,
  position,
  checklistTotal: 0,
  checklistDone: 0,
  assigneeIds: [],
  labelIds,
  commentCount: 0,
  dueDate: null,
});

// Scenario of RF08 section 3.
const lists: BoardListItem[] = [
  {
    id: "afazer",
    name: "A fazer",
    position: 1,
    cardCount: 3,
    cards: [card("Refatorar filtros", 1, ["front", "urg"]), card("Corrigir login", 2, ["bug"]), card("Escrever docs", 3, [])],
  },
  { id: "concluido", name: "Concluído", position: 2, cardCount: 1, cards: [card("Ajustar layout", 1, ["front"])] },
];

const board: BoardDetail = {
  id: "sprint",
  name: "Sprint",
  color: "navy",
  listCount: 2,
  cardCount: 4,
  lockListDeletion: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  myRole: "admin",
  memberCount: 1,
  memberPreview: [],
  overdueCount: 0,
  members: [],
  labels: [BUG, FRONT, URG],
  lists,
};

const shown = (projection: BoardListItem[]) => projection.map((list) => [list.name, list.cardCount, list.cards.map((c) => c.id)]);

describe("selection (spec 2.7)", () => {
  it("toggles labels and returns to 'Todas' when empty (CA28)", () => {
    const one = toggleSelection(NO_SELECTION, "bug");
    const two = toggleSelection(one, "urg");
    expect([...two]).toEqual(["bug", "urg"]);
    expect([...toggleSelection(toggleSelection(two, "bug"), "urg")]).toEqual([]);
    expect(NO_SELECTION.size).toBe(0);
  });

  it("drops labels that no longer exist, keeping the object when nothing changes (CA33, CB16)", () => {
    const selection = new Set(["front", "bug"]);
    expect([...pruneSelection(selection, [BUG, URG])]).toEqual(["bug"]);
    expect(pruneSelection(selection, [BUG, FRONT, URG])).toBe(selection);
    expect(pruneSelection(new Set(["front"]), [BUG]).size).toBe(0);
  });
});

describe("filterLists (RN08, F108)", () => {
  it("shows every card with 'Todas' (CA03)", () => {
    expect(shown(filterLists(lists, NO_SELECTION))).toEqual([
      ["A fazer", 3, ["Refatorar filtros", "Corrigir login", "Escrever docs"]],
      ["Concluído", 1, ["Ajustar layout"]],
    ]);
  });

  it("filters by one label and counts shown cards (CA25)", () => {
    expect(shown(filterLists(lists, new Set(["front"])))).toEqual([
      ["A fazer", 1, ["Refatorar filtros"]],
      ["Concluído", 1, ["Ajustar layout"]],
    ]);
  });

  it("uses 'at least one' for several labels, keeping order and empty lists (CA26)", () => {
    expect(shown(filterLists(lists, new Set(["bug", "urg"])))).toEqual([
      ["A fazer", 2, ["Refatorar filtros", "Corrigir login"]],
      ["Concluído", 0, []],
    ]);
  });

  it("shows a card with several selected labels once (CA27)", () => {
    const projection = filterLists(lists, new Set(["front", "urg"]));
    expect(countCards(projection)).toBe(2);
  });

  it("shows no cards for an unused label, keeping all lists (CA29)", () => {
    expect(shown(filterLists(lists, new Set(["ux"])))).toEqual([
      ["A fazer", 0, []],
      ["Concluído", 0, []],
    ]);
  });

  it("never changes the original lists (F102, CA34)", () => {
    filterLists(lists, new Set(["bug"]));
    expect(lists[0]?.cardCount).toBe(3);
    expect(lists[0]?.cards).toHaveLength(3);
  });

  it("matches cards without labels only with 'Todas'", () => {
    expect(cardMatches({ labelIds: [] }, NO_SELECTION)).toBe(true);
    expect(cardMatches({ labelIds: [] }, new Set(["bug"]))).toBe(false);
  });
});

describe("visibleTotalLabel (spec 2.8)", () => {
  it("shows the board total without filter, with singular (CA03)", () => {
    expect(visibleTotalLabel(4, 4, false)).toBe("4 cards no quadro");
    expect(visibleTotalLabel(1, 1, false)).toBe("1 card no quadro");
  });

  it("shows shown of total with filter (CA25, CA29, CA31)", () => {
    expect(visibleTotalLabel(2, 4, true)).toBe("2 de 4 cards");
    expect(visibleTotalLabel(0, 4, true)).toBe("0 de 4 cards");
    expect(visibleTotalLabel(1, 5, true)).toBe("1 de 5 cards");
  });
});

describe("board state updates (F110, F111)", () => {
  it("resolves card labels in label order, ignoring unknown ids (CA01, CA22)", () => {
    expect(resolveLabels(["urg", "gone", "bug"], board.labels).map((label) => label.name)).toEqual(["Bug", "Urgente"]);
  });

  it("applies saved labels, keeping lists (CA13)", () => {
    const renamed = withLabels(board, [BUG, { ...FRONT, name: "Front", color: "green" }, URG]);
    expect(renamed.labels[1]).toMatchObject({ name: "Front", color: "green" });
    expect(renamed.lists).toBe(board.lists);
  });

  it("updates only the labels of that card (CA20, CA21)", () => {
    const next = withCardLabels(board, "Escrever docs", ["bug"]);
    expect(next.lists[0]?.cards.map((c) => c.labelIds)).toEqual([["front", "urg"], ["bug"], ["bug"]]);
    expect(withCardLabels(board, "missing", ["bug"])).toBe(board);
  });

  it("removes a deleted label from the board and every card (CA17)", () => {
    const next = withoutLabel(board, "front");
    expect(next.labels.map((label) => label.id)).toEqual(["bug", "urg"]);
    expect(next.lists.flatMap((list) => list.cards.map((c) => c.labelIds))).toEqual([["urg"], ["bug"], [], []]);
    expect(countCards(next.lists)).toBe(4);
  });
});

describe("texts (spec 5.4)", () => {
  it("builds the deletion confirmation (CA17)", () => {
    expect(deleteLabelTitle("Frontend")).toBe('Excluir a etiqueta "Frontend"?');
    expect(deleteLabelBody(2)).toBe("Ela será removida de 2 cards. Os cards não serão excluídos.");
    expect(deleteLabelBody(1)).toBe("Ela será removida de 1 card. Os cards não serão excluídos.");
    expect(deleteLabelBody(0)).toBe("Nenhum card usa esta etiqueta.");
  });
});

describe("labelFailureAction (F112)", () => {
  it("handles board gone and FORBIDDEN on any operation (CB14)", () => {
    expect(labelFailureAction("apply", error("BOARD_NOT_FOUND"))).toBe("board-not-found");
    expect(labelFailureAction("create", error("FORBIDDEN"))).toBe("forbidden");
    expect(labelFailureAction("delete", error("FORBIDDEN"))).toBe("forbidden");
  });

  it("hands a deleted card to the board page (CB13)", () => {
    expect(labelFailureAction("apply", error("CARD_NOT_FOUND"))).toBe("card-gone");
    expect(labelFailureAction("unapply", error("CARD_NOT_FOUND"))).toBe("card-gone");
  });

  it("treats deleting or removing a label that is gone as success (CB12)", () => {
    expect(labelFailureAction("delete", error("LABEL_NOT_FOUND"))).toBe("done-and-reload");
    expect(labelFailureAction("unapply", error("LABEL_NOT_FOUND"))).toBe("done-and-reload");
  });

  it("reloads with the message when editing or applying a label that is gone (CA37)", () => {
    expect(labelFailureAction("apply", error("LABEL_NOT_FOUND"))).toBe("reload-with-message");
    expect(labelFailureAction("update", error("LABEL_NOT_FOUND"))).toBe("reload-with-message");
  });

  it.each(["VALIDATION_ERROR", "LABEL_NAME_TAKEN", "LABEL_LIMIT_REACHED"] as const)("shows %s next to the name (A63)", (code) => {
    expect(labelFailureAction("create", error(code))).toBe("show-in-field");
    expect(labelFailureAction("update", error(code))).toBe("show-in-field");
  });

  it("keeps other failures where they happened (CE01–CE03)", () => {
    expect(labelFailureAction("create", error("NETWORK_ERROR"))).toBe("show-in-form");
    expect(labelFailureAction("apply", error("NETWORK_ERROR"))).toBe("show-in-window");
    expect(labelFailureAction("delete", error("NETWORK_ERROR"))).toBe("show-in-confirmation");
  });
});
