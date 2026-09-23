import { describe, expect, it } from "vitest";
import type { ApiError } from "../api";
import { deleteOutcome, isBoardNotFound, removeBoard, replaceBoard } from "../boardsState";
import type { BoardSummary } from "@/services/boardService";

function board(id: string, name: string, extra: Partial<BoardSummary> = {}): BoardSummary {
  return {
    id,
    name,
    color: "navy",
    listCount: 0,
    cardCount: 0,
    lockListDeletion: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    myRole: "admin",
    memberCount: 1,
    memberPreview: [],
    overdueCount: 0,
    ...extra,
  };
}

const error = (code: ApiError["code"]): ApiError => ({ code, message: "x", fields: {} });

describe("listing state", () => {
  it("replaces an edited board in the same position (CA24, CA03)", () => {
    const list = [board("2", "Beta"), board("1", "Alfa"), board("0", "Gama")];
    const updated = replaceBoard(list, board("1", "Ômega", { color: "amber" }));
    expect(updated.map((b) => b.name)).toEqual(["Beta", "Ômega", "Gama"]);
    expect(updated[1]?.color).toBe("amber");
  });

  it("keeps the overdue count computed with the viewer's today after an edit (RF10 F140)", () => {
    const list = [board("1", "Alfa", { overdueCount: 2 })];
    const updated = replaceBoard(list, board("1", "Ômega", { overdueCount: 0 }));
    expect(updated[0]).toMatchObject({ name: "Ômega", overdueCount: 2 });
  });

  it("removes a deleted board and shrinks the total (CA31)", () => {
    const list = [board("2", "Beta"), board("1", "Alfa")];
    expect(removeBoard(list, "1")).toEqual([board("2", "Beta")]);
    expect(removeBoard(list, "missing")).toEqual(list);
  });

  it("does not mutate the previous state", () => {
    const list = [board("1", "Alfa")];
    replaceBoard(list, board("1", "Ômega"));
    removeBoard(list, "1");
    expect(list).toEqual([board("1", "Alfa")]);
  });
});

describe("deleteOutcome", () => {
  it("treats a successful response as deleted (CA31)", () => {
    expect(deleteOutcome(null)).toBe("deleted");
  });

  it("treats BOARD_NOT_FOUND as deleted, without an error (RN14, CB11, CA34)", () => {
    expect(deleteOutcome(error("BOARD_NOT_FOUND"))).toBe("deleted");
  });

  it("keeps the dialog open on any other failure (CE03)", () => {
    for (const code of ["NETWORK_ERROR", "INTERNAL_ERROR", "SESSION_EXPIRED"] as const) {
      expect(deleteOutcome(error(code))).toBe("failed");
    }
  });
});

describe("isBoardNotFound", () => {
  it("recognizes only the board not-found code (CA21, CA22)", () => {
    expect(isBoardNotFound(error("BOARD_NOT_FOUND"))).toBe(true);
    expect(isBoardNotFound(error("INTERNAL_ERROR"))).toBe(false);
  });
});
