import { describe, expect, it } from "vitest";
import type { BoardDetail, BoardMember, BoardSummary } from "@/services/boardService";
import type { MembersState } from "@/services/memberService";
import type { ApiError } from "../api";
import {
  assigneeFailureAction,
  avatarColor,
  boardsSubtitle,
  emailInitial,
  extraAvatarsLabel,
  insertBoardFirst,
  invitationFailureAction,
  leaveBoardTitle,
  memberFailureAction,
  memberStatus,
  removeMemberTitle,
  resolveAssignees,
  roleBadge,
  roleLabel,
  visibleAvatars,
  withCardAssignees,
  withMembersState,
} from "../members";

const error = (code: ApiError["code"]): ApiError => ({ code, message: "x", fields: {} });

const member = (userId: string, name: string, role: BoardMember["role"] = "member"): BoardMember => ({
  userId,
  name,
  email: `${userId}@empresa.com`,
  role,
});

const summary = (id: string, myRole: BoardSummary["myRole"]): BoardSummary => ({
  id,
  name: id,
  color: "navy",
  listCount: 0,
  cardCount: 0,
  lockListDeletion: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  myRole,
  memberCount: 1,
  memberPreview: [],
  overdueCount: 0,
});

describe("visibleAvatars (C171)", () => {
  it("shows up to the limit and counts the rest (CA35)", () => {
    expect(visibleAvatars([1, 2, 3, 4, 5], 3)).toEqual({ shown: [1, 2, 3], extra: 2 });
    expect(visibleAvatars([1, 2], 4)).toEqual({ shown: [1, 2], extra: 0 });
    expect(visibleAvatars([], 4)).toEqual({ shown: [], extra: 0 });
  });

  it("labels the extra count for assistive technology (N151)", () => {
    expect(extraAvatarsLabel(2)).toBe("e mais 2 pessoas");
    expect(extraAvatarsLabel(1)).toBe("e mais 1 pessoa");
  });
});

describe("texts (spec 5.4)", () => {
  it("names roles and badges (N154)", () => {
    expect([roleLabel("admin"), roleLabel("member")]).toEqual(["Administrador", "Membro"]);
    expect([roleBadge("admin"), roleBadge("member")]).toEqual(["ADMIN", "MEMBRO"]);
  });

  it("marks the own row as 'você' and others as 'ativo' (CA01, CA12)", () => {
    expect(memberStatus({ userId: "caio" }, "caio")).toBe("você");
    expect(memberStatus({ userId: "ana" }, "caio")).toBe("ativo");
  });

  it("builds the listing subtitle with singular and admin count (CA02, RN14)", () => {
    expect(boardsSubtitle([summary("a", "admin"), summary("b", "member"), summary("c", "admin"), summary("d", "admin")])).toBe(
      "4 quadros · você é administrador em 3",
    );
    expect(boardsSubtitle([summary("a", "member")])).toBe("1 quadro · você é administrador em 0");
    expect(boardsSubtitle([])).toBe("0 quadros · você é administrador em 0");
  });

  it("builds confirmation titles (spec 2.7)", () => {
    expect(removeMemberTitle("João Lima")).toBe("Remover João Lima do quadro?");
    expect(leaveBoardTitle("Sprint")).toBe('Sair do quadro "Sprint"?');
  });

  it("uses the first letter of the e-mail for invitations (spec 2.3)", () => {
    expect(emailInitial("ana@empresa.com")).toBe("A");
  });

  it("keeps the same color for the same person", () => {
    expect(avatarColor("caio")).toBe(avatarColor("caio"));
    expect(avatarColor("caio")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("resolveAssignees (F94)", () => {
  it("keeps the order of assignment and drops ids without participant", () => {
    const members = [member("caio", "Caio"), member("joao", "João"), member("marina", "Marina")];
    expect(resolveAssignees(["marina", "gone", "caio"], members).map((m) => m.name)).toEqual(["Marina", "Caio"]);
  });
});

describe("board state updates", () => {
  const board: BoardDetail = {
    ...summary("b", "admin"),
    members: [member("caio", "Caio", "admin")],
    labels: [],
    lists: [
      {
        id: "l1",
        name: "A fazer",
        position: 1,
        cardCount: 2,
        cards: [
          { id: "c1", title: "c1", position: 1, checklistTotal: 0, checklistDone: 0, assigneeIds: [], labelIds: [], commentCount: 0, dueDate: null },
          { id: "c2", title: "c2", position: 2, checklistTotal: 0, checklistDone: 0, assigneeIds: ["caio"], labelIds: [], commentCount: 0, dueDate: null },
        ],
      },
    ],
  };

  it("updates only the assignees of that card (CA31, CA33)", () => {
    const next = withCardAssignees(board, "c1", ["joao"]);
    expect(next.lists[0]?.cards.map((c) => c.assigneeIds)).toEqual([["joao"], ["caio"]]);
    expect(withCardAssignees(board, "missing", ["x"])).toBe(board);
  });

  it("applies role and people from the members window (CA19, C168)", () => {
    const state: MembersState = {
      myRole: "member",
      members: [
        { userId: "caio", name: "Caio", email: "c@e.com", role: "member", joinedAt: "" },
        { userId: "marina", name: "Marina", email: "m@e.com", role: "admin", joinedAt: "" },
      ],
      invitations: [{ id: "i", email: "ana@e.com", role: "member", createdAt: "" }],
    };
    const next = withMembersState(board, state);
    expect(next.myRole).toBe("member");
    expect(next.members.map((m) => m.userId)).toEqual(["caio", "marina"]);
    expect(next.memberCount).toBe(2);
    expect(next.lists).toBe(board.lists);
  });

  it("inserts an accepted board first without duplicates (CA12)", () => {
    const grid = [summary("a", "admin"), summary("b", "admin")];
    expect(insertBoardFirst(grid, summary("s", "member")).map((b) => b.id)).toEqual(["s", "a", "b"]);
    expect(insertBoardFirst(grid, summary("b", "member")).map((b) => b.id)).toEqual(["b", "a"]);
  });
});

describe("memberFailureAction (F90, F91, C165)", () => {
  it("leaves the board when the account no longer participates (CB13)", () => {
    expect(memberFailureAction("invite", error("BOARD_NOT_FOUND"))).toBe("board-not-found");
  });

  it("reloads on FORBIDDEN (CA10, CA25, CA40)", () => {
    expect(memberFailureAction("member-role", error("FORBIDDEN"))).toBe("forbidden");
  });

  it.each(["VALIDATION_ERROR", "ALREADY_MEMBER", "INVITATION_ALREADY_PENDING", "MEMBER_LIMIT_REACHED"] as const)(
    "shows %s next to the e-mail (A58)",
    (code) => {
      expect(memberFailureAction("invite", error(code))).toBe("show-in-field");
    },
  );

  it("treats removing or cancelling what is gone as success (CB17)", () => {
    expect(memberFailureAction("remove", error("MEMBER_NOT_FOUND"))).toBe("done-and-reload");
    expect(memberFailureAction("cancel", error("INVITATION_NOT_FOUND"))).toBe("done-and-reload");
  });

  it("reloads with the message when a role change finds nothing (CB05)", () => {
    expect(memberFailureAction("member-role", error("MEMBER_NOT_FOUND"))).toBe("reload-with-message");
    expect(memberFailureAction("invitation-role", error("INVITATION_NOT_FOUND"))).toBe("reload-with-message");
  });

  it("keeps LAST_ADMIN and generic failures in the window (CA20, CE02, CE03)", () => {
    expect(memberFailureAction("member-role", error("LAST_ADMIN"))).toBe("show-in-window");
    expect(memberFailureAction("leave", error("LAST_ADMIN"))).toBe("show-in-window");
    expect(memberFailureAction("remove", error("NETWORK_ERROR"))).toBe("show-in-window");
  });
});

describe("invitationFailureAction (F92)", () => {
  it("removes an invitation that no longer exists (CA16, CB19)", () => {
    expect(invitationFailureAction(error("INVITATION_NOT_FOUND"))).toBe("remove-with-message");
    expect(invitationFailureAction(error("NETWORK_ERROR"))).toBe("keep-with-message");
  });
});

describe("assigneeFailureAction (F93)", () => {
  it("hands board or card gone to the board page", () => {
    expect(assigneeFailureAction(error("BOARD_NOT_FOUND"))).toBe("card-gone");
    expect(assigneeFailureAction(error("CARD_NOT_FOUND"))).toBe("card-gone");
  });

  it("reloads people when the person left the board (CA36, CB15)", () => {
    expect(assigneeFailureAction(error("ASSIGNEE_NOT_MEMBER"))).toBe("reload");
  });

  it("keeps the saved selection with the message otherwise (CE04)", () => {
    expect(assigneeFailureAction(error("NETWORK_ERROR"))).toBe("show-in-section");
  });
});
