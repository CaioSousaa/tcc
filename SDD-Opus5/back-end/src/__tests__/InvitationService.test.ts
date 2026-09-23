import { beforeEach, describe, expect, it } from "vitest";
import { ACCOUNTS, ANA, CAIO, JOAO, PEDRO, code, sprintBoard } from "./helpers/sprintBoard";

type Scenario = Awaited<ReturnType<typeof sprintBoard>>;

describe("InvitationService (RF07)", () => {
  let s: Scenario;

  beforeEach(async () => {
    s = await sprintBoard();
  });

  it("lists the invitations of the session e-mail with board and inviter name (CA11, N145)", async () => {
    const [invitation, ...rest] = await s.invitations.list(ACCOUNTS.ana);
    expect(rest).toEqual([]);
    expect(invitation).toMatchObject({
      id: s.anaInvitation,
      role: "member",
      board: { id: s.sprint, name: "Sprint", color: "navy" },
      invitedBy: { name: "Caio Sousa" },
    });
    expect(invitation?.invitedBy).not.toHaveProperty("email");
  });

  it("lists invitations of several boards from newest to oldest (CB09)", async () => {
    const other = await s.boards.create(JOAO, { name: "Outro", color: "green", withDefaultLists: false });
    await s.members.invite(JOAO, other.id, { email: ACCOUNTS.ana.email, role: "admin" });
    expect((await s.invitations.list(ACCOUNTS.ana)).map((i) => i.board.name)).toEqual(["Outro", "Sprint"]);
  });

  it("shows an invitation sent before the account existed (CA09)", async () => {
    await s.members.invite(CAIO, s.sprint, { email: ACCOUNTS.pedro.email, role: "member" });
    s.store.addUser(PEDRO, "Pedro Costa", ACCOUNTS.pedro.email);
    expect((await s.invitations.list(ACCOUNTS.pedro)).map((i) => i.board.name)).toEqual(["Sprint"]);
  });

  it("accepts: participant with the role, invitation gone, entered after João (CA12, RN09)", async () => {
    const board = await s.invitations.accept(ACCOUNTS.ana, s.anaInvitation);
    expect(board).toMatchObject({ id: s.sprint, myRole: "member", memberCount: 4 });
    expect(await s.invitations.list(ACCOUNTS.ana)).toEqual([]);
    const state = await s.members.get(ANA, s.sprint);
    expect(state.members.map((m) => m.userId)).toEqual([CAIO, expect.any(String), JOAO, ANA]);
    expect(state.invitations).toEqual([]);
  });

  it("accepts with the current role of the invitation (CA13)", async () => {
    await s.members.updateInvitation(CAIO, s.sprint, s.anaInvitation, { role: "admin" });
    expect((await s.invitations.accept(ACCOUNTS.ana, s.anaInvitation)).myRole).toBe("admin");
  });

  it("declines: invitation gone, still no access (CA14)", async () => {
    await s.invitations.decline(ACCOUNTS.ana, s.anaInvitation);
    expect(await s.invitations.list(ACCOUNTS.ana)).toEqual([]);
    expect((await s.members.get(CAIO, s.sprint)).invitations).toEqual([]);
    expect(await code(s.boards.get(ANA, s.sprint))).toBe("BOARD_NOT_FOUND");
  });

  it("refuses accepting a cancelled invitation (CA16)", async () => {
    await s.members.cancelInvitation(CAIO, s.sprint, s.anaInvitation);
    expect(await code(s.invitations.accept(ACCOUNTS.ana, s.anaInvitation))).toBe("INVITATION_NOT_FOUND");
    expect(await code(s.boards.get(ANA, s.sprint))).toBe("BOARD_NOT_FOUND");
  });

  it("hides invitations of another e-mail (RN08, N141)", async () => {
    expect(await code(s.invitations.accept(ACCOUNTS.bruno, s.anaInvitation))).toBe("INVITATION_NOT_FOUND");
    expect(await code(s.invitations.decline(ACCOUNTS.bruno, s.anaInvitation))).toBe("INVITATION_NOT_FOUND");
    expect(await code(s.invitations.accept(ACCOUNTS.ana, "abc"))).toBe("INVITATION_NOT_FOUND");
  });

  it("serializes accept and cancel: exactly one wins (CB12, N148)", async () => {
    const [accepted, cancelled] = await Promise.allSettled([
      s.invitations.accept(ACCOUNTS.ana, s.anaInvitation),
      s.members.cancelInvitation(CAIO, s.sprint, s.anaInvitation),
    ]);
    const isMember = s.store.member(s.sprint, ANA) !== undefined;
    if (accepted.status === "fulfilled") {
      expect(isMember).toBe(true);
      expect(cancelled.status).toBe("rejected");
    } else {
      expect(isMember).toBe(false);
      expect(cancelled.status).toBe("fulfilled");
    }
    expect(s.store.invitationsOf(s.sprint)).toEqual([]);
  });

  it("answers INVITATION_NOT_FOUND after the board was deleted (CB19)", async () => {
    await s.boards.delete(CAIO, s.sprint);
    expect(await s.invitations.list(ACCOUNTS.ana)).toEqual([]);
    expect(await code(s.invitations.accept(ACCOUNTS.ana, s.anaInvitation))).toBe("INVITATION_NOT_FOUND");
  });
});
