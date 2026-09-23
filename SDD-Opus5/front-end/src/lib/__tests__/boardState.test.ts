import { describe, expect, it } from "vitest";
import type { BoardDetail, BoardListItem } from "@/services/boardService";
import { replaceLists, withLists } from "../boardState";

const list = (id: string, titles: string[], position: number): BoardListItem => ({
  id,
  name: id,
  position,
  cardCount: titles.length,
  cards: titles.map((title, index) => ({ id: `${id}-${title}`, title, position: index + 1, checklistTotal: 0, checklistDone: 0, assigneeIds: [], labelIds: [], commentCount: 0, dueDate: null })),
});

const board: BoardDetail = {
  id: "b",
  name: "Sprint",
  color: "navy",
  listCount: 3,
  cardCount: 4,
  lockListDeletion: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  myRole: "admin",
  memberCount: 1,
  memberPreview: [],
  overdueCount: 0,
  members: [],
  labels: [],
  lists: [list("a", ["C1", "C2", "C3"], 1), list("b", ["P1"], 2), list("c", [], 3)],
};

describe("replaceLists (F47, CB21)", () => {
  it("replaces only the affected lists, keeping order and the other lists", () => {
    const next = replaceLists(board, [list("a", ["C1", "C3"], 1), list("b", ["P1", "C2"], 2)]);
    expect(next.lists.map((l) => [l.id, l.cards.map((c) => c.title)])).toEqual([
      ["a", ["C1", "C3"]],
      ["b", ["P1", "C2"]],
      ["c", []],
    ]);
    expect(next.lists[2]).toBe(board.lists[2]);
  });

  it("keeps the board total in sync with the lists (RN17)", () => {
    expect(replaceLists(board, [list("c", ["D1"], 3)]).cardCount).toBe(5);
  });

  it("does not mutate the previous state", () => {
    const copy = structuredClone(board);
    replaceLists(board, [list("a", [], 1)]);
    expect(board).toEqual(copy);
  });

  it("ignores lists that are not on the board", () => {
    expect(replaceLists(board, [list("zzz", ["X"], 9)]).lists).toEqual(board.lists);
  });
});

describe("withLists (RF03 F28)", () => {
  it("replaces all lists and recomputes the counts", () => {
    const next = withLists(board, [list("b", ["P1"], 1)]);
    expect([next.listCount, next.cardCount]).toEqual([1, 1]);
  });
});
