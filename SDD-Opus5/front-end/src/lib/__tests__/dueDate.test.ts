import { describe, expect, it } from "vitest";
import type { BoardListItem } from "@/services/boardService";
import {
  DUE_BADGE_COLORS,
  daysUntil,
  dueAccessibleName,
  dueStatus,
  formatDueField,
  isValidDueDate,
  localToday,
  projectLists,
  sortCardsByDueDate,
} from "../dueDate";
import { NO_SELECTION } from "../labels";

const TODAY = "2026-08-29";

const card = (id: string, position: number, dueDate: string | null, labelIds: string[] = []) => ({
  id,
  title: id,
  position,
  checklistTotal: 0,
  checklistDone: 0,
  assigneeIds: [],
  labelIds,
  commentCount: 0,
  dueDate,
});

// Scenario of RF10 section 3.
const lists: BoardListItem[] = [
  {
    id: "afazer",
    name: "A fazer",
    position: 1,
    cardCount: 4,
    cards: [
      card("Convite de membros", 1, "2026-09-03", ["front"]),
      card("Migrar cards", 2, "2026-08-31"),
      card("Escrever docs", 3, null, ["front"]),
      card("Refatorar filtros", 4, "2026-08-27", ["front"]),
    ],
  },
  { id: "concluido", name: "Concluído", position: 2, cardCount: 1, cards: [card("Ajustar layout", 1, "2026-08-28")] },
];

describe("localToday (RN02, F143)", () => {
  it("uses the local calendar date of the device", () => {
    expect(localToday(new Date(2026, 7, 29, 0, 5))).toBe("2026-08-29");
    expect(localToday(new Date(2026, 7, 29, 23, 59))).toBe("2026-08-29");
    expect(localToday(new Date(2027, 0, 5, 12, 0))).toBe("2027-01-05");
  });
});

describe("daysUntil (F143, CB10)", () => {
  it("counts calendar days, negative when past", () => {
    expect(daysUntil("2026-08-29", TODAY)).toBe(0);
    expect(daysUntil("2026-08-30", TODAY)).toBe(1);
    expect(daysUntil("2026-08-27", TODAY)).toBe(-2);
  });

  it("crosses month and year boundaries", () => {
    expect(daysUntil("2026-12-31", "2026-12-30")).toBe(1);
    expect(daysUntil("2026-12-31", "2027-01-01")).toBe(-1);
    expect(daysUntil("2026-03-01", "2026-02-28")).toBe(1);
    expect(daysUntil("2028-03-01", "2028-02-28")).toBe(2);
  });

  it("is not affected by daylight saving transitions", () => {
    expect(daysUntil("2026-11-02", "2026-10-31")).toBe(2);
    expect(daysUntil("2026-03-30", "2026-03-28")).toBe(2);
  });
});

describe("dueStatus (spec 2.3, RN03, F144)", () => {
  it.each([
    ["2026-08-27", "overdue", "Atrasado há 2 dias"],
    ["2026-08-28", "overdue", "Atrasado há 1 dia"],
    ["2026-08-29", "soon", "Vence hoje"],
    ["2026-08-30", "soon", "Vence amanhã"],
    ["2026-08-31", "soon", "Vence 31 ago"],
    ["2026-09-01", "ok", "Vence 1 set"],
    ["2026-09-03", "ok", "Vence 3 set"],
    ["2027-01-05", "ok", "Vence 5 jan 2027"],
    ["2026-08-01", "overdue", "Atrasado há 28 dias"],
  ])("%s is %s: %s (CA01–CA03, CA13)", (due, kind, text) => {
    expect(dueStatus(due, TODAY)).toMatchObject({ kind, text });
  });

  it("has no status without a due date (CA06)", () => {
    expect(dueStatus(null, TODAY)).toEqual({ kind: "none" });
  });

  it("changes with the passing days, not with edits (CA04)", () => {
    expect(dueStatus("2026-09-03", "2026-09-01")).toMatchObject({ kind: "soon", text: "Vence 3 set" });
    expect(dueStatus("2026-09-03", "2026-09-03")).toMatchObject({ kind: "soon", text: "Vence hoje" });
    expect(dueStatus("2026-09-03", "2026-09-05")).toMatchObject({ kind: "overdue", text: "Atrasado há 2 dias" });
  });

  it("shows the year of a past due date from another year", () => {
    expect(dueStatus("2025-12-31", "2026-01-01")).toMatchObject({ kind: "overdue", text: "Atrasado há 1 dia" });
    expect(dueStatus("2026-12-31", "2026-12-30")).toMatchObject({ kind: "soon", text: "Vence amanhã" });
  });
});

describe("texts (RN09)", () => {
  it("formats the field as DD/MM/AAAA", () => {
    expect(formatDueField("2026-08-27")).toBe("27/08/2026");
  });

  it("builds the accessible name (CA07)", () => {
    expect(dueAccessibleName("2026-08-27", dueStatus("2026-08-27", TODAY))).toBe("Prazo: 27/08/2026. Atrasado há 2 dias.");
  });
});

describe("isValidDueDate (RN01, CB01–CB03)", () => {
  it("accepts calendar dates in 2000–2099", () => {
    for (const value of ["2028-02-29", "2000-01-01", "2099-12-31"]) expect(isValidDueDate(value)).toBe(true);
  });

  it.each(["2026-02-29", "2026-04-31", "2026-05-00", "2026-13-13", "1999-12-31", "2100-01-01", "", "12/0"])("rejects %j", (value) => {
    expect(isValidDueDate(value)).toBe(false);
  });
});

describe("badge colors (N211)", () => {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5]
      .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  it.each(Object.entries(DUE_BADGE_COLORS))("keeps a contrast of at least 4.5:1 for %s", (_kind, colors) => {
    const [light, dark] = [luminance(colors.background), luminance(colors.text)].sort((a, b) => b - a) as [number, number];
    expect((light + 0.05) / (dark + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
});

const titles = (projection: BoardListItem[]) => projection.map((list) => [list.name, list.cardCount, list.cards.map((c) => c.id)]);

describe("sortCardsByDueDate (RN06, F147)", () => {
  it("orders by due date with cards without due date last (CA18)", () => {
    expect(sortCardsByDueDate(lists[0]?.cards ?? []).map((c) => c.id)).toEqual([
      "Refatorar filtros",
      "Migrar cards",
      "Convite de membros",
      "Escrever docs",
    ]);
  });

  it("keeps the list order on ties (CA19)", () => {
    const tied = [card("Convite", 1, "2026-08-31"), card("Migrar", 2, "2026-08-31"), card("Docs", 3, null), card("Refatorar", 4, "2026-08-27"), card("Revisar", 5, null)];
    expect(sortCardsByDueDate(tied).map((c) => c.id)).toEqual(["Refatorar", "Convite", "Migrar", "Docs", "Revisar"]);
  });

  it("never changes the input or positions (CA21)", () => {
    const input = lists[0]?.cards ?? [];
    sortCardsByDueDate(input);
    expect(input.map((c) => c.id)[0]).toBe("Convite de membros");
    expect(input.find((c) => c.id === "Escrever docs")?.position).toBe(3);
  });
});

describe("projectLists (F141, F147)", () => {
  it("keeps the list order when off (CA20)", () => {
    expect(titles(projectLists(lists, NO_SELECTION, false))[0]?.[2]).toEqual([
      "Convite de membros",
      "Migrar cards",
      "Escrever docs",
      "Refatorar filtros",
    ]);
  });

  it("sorts every list without changing counts (CA18)", () => {
    expect(titles(projectLists(lists, NO_SELECTION, true))).toEqual([
      ["A fazer", 4, ["Refatorar filtros", "Migrar cards", "Convite de membros", "Escrever docs"]],
      ["Concluído", 1, ["Ajustar layout"]],
    ]);
  });

  it("filters by label first, then sorts, with the filtered count (CA23)", () => {
    expect(titles(projectLists(lists, new Set(["front"]), true))[0]).toEqual([
      "A fazer",
      3,
      ["Refatorar filtros", "Convite de membros", "Escrever docs"],
    ]);
  });

  it("reapplies the order after a save changes a due date (CA24)", () => {
    const saved = lists.map((list) =>
      list.id === "afazer"
        ? { ...list, cards: list.cards.map((c) => (c.id === "Escrever docs" ? { ...c, dueDate: "2026-08-28" } : c)) }
        : list,
    );
    expect(titles(projectLists(saved, NO_SELECTION, true))[0]?.[2]).toEqual([
      "Refatorar filtros",
      "Escrever docs",
      "Migrar cards",
      "Convite de membros",
    ]);
  });
});
