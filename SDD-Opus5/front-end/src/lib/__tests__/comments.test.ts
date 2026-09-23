import { describe, expect, it } from "vitest";
import type { BoardDetail } from "@/services/boardService";
import type { ApiError } from "../api";
import {
  canDeleteComment,
  canEditComment,
  commentCountLabel,
  commentFailureAction,
  normalizeCommentBody,
  withCardCommentCount,
} from "../comments";

const error = (code: ApiError["code"]): ApiError => ({ code, message: "x", fields: {} });
const byJoao = { author: { userId: "joao", name: "João" } };

describe("normalizeCommentBody (RF09 2.4)", () => {
  it("turns CR LF into LF and trims the ends only (CB01)", () => {
    expect(normalizeCommentBody("  Linha 1\r\n\r\nLinha 2 \r ")).toBe("Linha 1\n\nLinha 2");
  });
});

describe("comment actions (RN05, F127)", () => {
  it("lets only the author edit, whatever the role (CA14, CA17)", () => {
    expect(canEditComment(byJoao, "joao")).toBe(true);
    expect(canEditComment(byJoao, "caio")).toBe(false);
    expect(canEditComment(byJoao, undefined)).toBe(false);
  });

  it("lets the author or an administrator delete (CA19, CA21, CA22, CA26)", () => {
    expect(canDeleteComment(byJoao, "joao", "member")).toBe(true);
    expect(canDeleteComment(byJoao, "caio", "admin")).toBe(true);
    expect(canDeleteComment(byJoao, "marina", "member")).toBe(false);
  });
});

describe("face indicator (spec 2.7)", () => {
  it("names the count with singular and plural (CA03)", () => {
    expect(commentCountLabel(2)).toBe("2 comentários");
    expect(commentCountLabel(1)).toBe("1 comentário");
  });

  it("updates only the count of that card (CA06, CA19)", () => {
    const card = (id: string, commentCount: number) => ({
      id,
      title: id,
      position: 1,
      checklistTotal: 0,
      checklistDone: 0,
      assigneeIds: [],
      labelIds: [],
      commentCount,
      dueDate: null,
    });
    const board: BoardDetail = {
      id: "b",
      name: "Sprint",
      color: "navy",
      listCount: 1,
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
      lists: [{ id: "l", name: "A fazer", position: 1, cardCount: 2, cards: [card("refatorar", 2), card("docs", 0)] }],
    };
    const next = withCardCommentCount(board, "refatorar", 3);
    expect(next.lists[0]?.cards.map((c) => c.commentCount)).toEqual([3, 0]);
    expect(withCardCommentCount(board, "missing", 1)).toBe(board);
  });
});

describe("commentFailureAction (F133)", () => {
  it("hands board and card gone to the board page (CA31, CB15)", () => {
    expect(commentFailureAction("create", error("BOARD_NOT_FOUND"))).toBe("board-not-found");
    expect(commentFailureAction("create", error("CARD_NOT_FOUND"))).toBe("card-gone");
  });

  it("reloads the role on FORBIDDEN (CB14)", () => {
    expect(commentFailureAction("delete", error("FORBIDDEN"))).toBe("forbidden");
    expect(commentFailureAction("update", error("FORBIDDEN"))).toBe("forbidden");
  });

  it("treats deleting a gone comment as success and reloads after a gone edit (CB11, CA29)", () => {
    expect(commentFailureAction("delete", error("COMMENT_NOT_FOUND"))).toBe("done-and-reload");
    expect(commentFailureAction("update", error("COMMENT_NOT_FOUND"))).toBe("reload-with-message");
  });

  it("keeps other failures next to the text or in the confirmation (CA08, CA32, CE01–CE03)", () => {
    expect(commentFailureAction("create", error("VALIDATION_ERROR"))).toBe("show-in-field");
    expect(commentFailureAction("create", error("COMMENT_LIMIT_REACHED"))).toBe("show-in-field");
    expect(commentFailureAction("update", error("NETWORK_ERROR"))).toBe("show-in-field");
    expect(commentFailureAction("delete", error("NETWORK_ERROR"))).toBe("show-in-confirmation");
  });
});
