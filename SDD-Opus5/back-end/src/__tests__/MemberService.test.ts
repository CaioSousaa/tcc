import { beforeEach, describe, expect, it } from "vitest";
import { BOARD_PEOPLE_MAX } from "../domain/members";
import { ACCOUNTS, BRUNO, CAIO, JOAO, MARINA, PEDRO, code, sprintBoard } from "./helpers/sprintBoard";

type Scenario = Awaited<ReturnType<typeof sprintBoard>>;

const MISSING = "c0000000-0000-4000-8000-0000000000ff";

describe("MemberService (RF07)", () => {
  let s: Scenario;

  const people = async (userId = CAIO) => {
    const state = await s.members.get(userId, s.sprint);
    return [
      ...state.members.map((m) => `${m.email}:${m.role}`),
      ...state.invitations.map((i) => `${i.email}:${i.role}:pending`),
    ];
  };

  beforeEach(async () => {
    s = await sprintBoard();
  });

  describe("access", () => {
    it("makes the creator the only administrator of a new board (CA01, RN01, F85)", async () => {
      const board = await s.boards.create(CAIO, { name: "Novo", color: "green", withDefaultLists: true });
      const state = await s.members.get(CAIO, board.id);
      expect(state).toMatchObject({ myRole: "admin", invitations: [] });
      expect(state.members.map((m) => [m.userId, m.role])).toEqual([[CAIO, "admin"]]);
      expect(board).toMatchObject({ myRole: "admin", memberCount: 1 });
      expect(board.members).toEqual([{ userId: CAIO, name: "Caio Sousa", email: ACCOUNTS.caio.email, role: "admin" }]);
    });

    it("lists people in order of entry, then invitations in order of sending (RN13, CA12)", async () => {
      expect(await people(JOAO)).toEqual([
        "caio@empresa.com:admin",
        "marina@empresa.com:admin",
        "joao@empresa.com:member",
        "ana@empresa.com:member:pending",
      ]);
    });

    it("shows role, avatars and counts in the listing (CA02, RN14)", async () => {
      const [sprint] = await s.boards.list(JOAO);
      expect(sprint).toMatchObject({ name: "Sprint", myRole: "member", memberCount: 3 });
      expect(sprint?.memberPreview.map((p) => p.name)).toEqual(["Caio Sousa", "Marina Alves", "João Pereira"]);
    });

    it("limits the listing preview to 4 people (spec 2.1)", async () => {
      s.store.addMember(s.sprint, BRUNO, "member");
      s.store.addMember(s.sprint, PEDRO, "member");
      const [sprint] = await s.boards.list(CAIO);
      expect(sprint?.memberCount).toBe(5);
      expect(sprint?.memberPreview).toHaveLength(4);
    });

    it("gives no access with a pending invitation (CA03, RN02)", async () => {
      expect(await code(s.boards.get(ACCOUNTS.ana.id, s.sprint))).toBe("BOARD_NOT_FOUND");
      expect(await s.boards.list(ACCOUNTS.ana.id)).toEqual([]);
    });

    it("answers BOARD_NOT_FOUND to non participants before any role check (CA04, F80, C178)", async () => {
      expect(await code(s.members.get(BRUNO, s.sprint))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.members.invite(BRUNO, s.sprint, { email: "x@empresa.com", role: "member" }))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.members.updateMember(BRUNO, s.sprint, JOAO, { role: "admin" }))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.members.removeMember(BRUNO, s.sprint, JOAO))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.members.cancelInvitation(BRUNO, s.sprint, s.anaInvitation))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.boards.update(BRUNO, s.sprint, { name: "Hack", color: "amber" }))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.lists.create(BRUNO, s.sprint, { name: "X", position: undefined }))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.cards.create(BRUNO, s.sprint, s.aFazer, { title: "X" }))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.assignees.assign(BRUNO, s.sprint, s.card, BRUNO))).toBe("BOARD_NOT_FOUND");
    });
  });

  describe("invite", () => {
    it("creates a pending invitation at the end with the chosen role (CA05)", async () => {
      const state = await s.members.invite(CAIO, s.sprint, { email: "pedro@empresa.com", role: "admin" });
      expect(state.invitations.map((i) => [i.email, i.role])).toEqual([
        ["ana@empresa.com", "member"],
        ["pedro@empresa.com", "admin"],
      ]);
    });

    it("refuses e-mails of participants, including the inviter (CA07)", async () => {
      expect(await code(s.members.invite(CAIO, s.sprint, { email: "joao@empresa.com", role: "member" }))).toBe("ALREADY_MEMBER");
      expect(await code(s.members.invite(CAIO, s.sprint, { email: "caio@empresa.com", role: "member" }))).toBe("ALREADY_MEMBER");
      expect(s.store.invitationsOf(s.sprint)).toHaveLength(1);
    });

    it("refuses a second pending invitation for the same e-mail (CA08)", async () => {
      expect(await code(s.members.invite(CAIO, s.sprint, { email: "ana@empresa.com", role: "admin" }))).toBe(
        "INVITATION_ALREADY_PENDING",
      );
    });

    it("translates the unique constraint into INVITATION_ALREADY_PENDING (F87)", async () => {
      s.memberRepo.hideInvitationsFromLookup = true;
      expect(await code(s.members.invite(CAIO, s.sprint, { email: "ana@empresa.com", role: "member" }))).toBe(
        "INVITATION_ALREADY_PENDING",
      );
    });

    it("lets simultaneous invitations to the same e-mail create only one (CB11)", async () => {
      const results = await Promise.allSettled([
        s.members.invite(CAIO, s.sprint, { email: "pedro@empresa.com", role: "member" }),
        s.members.invite(MARINA, s.sprint, { email: "pedro@empresa.com", role: "admin" }),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(s.store.invitationsOf(s.sprint).filter((i) => i.email === "pedro@empresa.com")).toHaveLength(1);
    });

    it("refuses members (CA10, RN05)", async () => {
      expect(await code(s.members.invite(JOAO, s.sprint, { email: "pedro@empresa.com", role: "member" }))).toBe("FORBIDDEN");
      expect(s.store.invitationsOf(s.sprint)).toHaveLength(1);
    });

    it("counts participants and invitations against the limit of 50 (RN12)", async () => {
      // 3 participants + 1 invitation already; fill up to 50.
      for (let i = 0; i < BOARD_PEOPLE_MAX - 4; i += 1) {
        await s.members.invite(CAIO, s.sprint, { email: `p${i}@empresa.com`, role: "member" });
      }
      expect(await code(s.members.invite(CAIO, s.sprint, { email: "extra@empresa.com", role: "member" }))).toBe(
        "MEMBER_LIMIT_REACHED",
      );
    });

    it("never goes over the limit with simultaneous invitations at 49 (CB08, F86)", async () => {
      for (let i = 0; i < BOARD_PEOPLE_MAX - 5; i += 1) {
        await s.members.invite(CAIO, s.sprint, { email: `p${i}@empresa.com`, role: "member" });
      }
      const results = await Promise.allSettled([
        s.members.invite(CAIO, s.sprint, { email: "a@empresa.com", role: "member" }),
        s.members.invite(MARINA, s.sprint, { email: "b@empresa.com", role: "member" }),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(s.store.membersOf(s.sprint).length + s.store.invitationsOf(s.sprint).length).toBe(BOARD_PEOPLE_MAX);
    });

    it("allows inviting again after the invitation was declined (CA17)", async () => {
      await s.invitations.decline(ACCOUNTS.ana, s.anaInvitation);
      const state = await s.members.invite(CAIO, s.sprint, { email: "ana@empresa.com", role: "member" });
      expect(state.invitations.map((i) => i.email)).toEqual(["ana@empresa.com"]);
    });
  });

  describe("invitation role and cancel", () => {
    it("changes the role of a pending invitation (CA13)", async () => {
      const state = await s.members.updateInvitation(CAIO, s.sprint, s.anaInvitation, { role: "admin" });
      expect(state.invitations[0]?.role).toBe("admin");
    });

    it("cancels a pending invitation (CA15)", async () => {
      const state = await s.members.cancelInvitation(CAIO, s.sprint, s.anaInvitation);
      expect(state.invitations).toEqual([]);
      expect(await s.invitations.list(ACCOUNTS.ana)).toEqual([]);
    });

    it("answers INVITATION_NOT_FOUND for missing, malformed or foreign invitations (CB05, CB06, CB17)", async () => {
      await s.members.cancelInvitation(CAIO, s.sprint, s.anaInvitation);
      expect(await code(s.members.cancelInvitation(CAIO, s.sprint, s.anaInvitation))).toBe("INVITATION_NOT_FOUND");
      expect(await code(s.members.updateInvitation(CAIO, s.sprint, "abc", { role: "admin" }))).toBe("INVITATION_NOT_FOUND");

      const other = await s.boards.create(BRUNO, { name: "Outro", color: "amber", withDefaultLists: false });
      const { invitations } = await s.members.invite(BRUNO, other.id, { email: "x@empresa.com", role: "member" });
      expect(await code(s.members.cancelInvitation(CAIO, s.sprint, invitations[0]?.id ?? ""))).toBe("INVITATION_NOT_FOUND");
    });

    it("refuses members (CA25)", async () => {
      expect(await code(s.members.updateInvitation(JOAO, s.sprint, s.anaInvitation, { role: "admin" }))).toBe("FORBIDDEN");
      expect(await code(s.members.cancelInvitation(JOAO, s.sprint, s.anaInvitation))).toBe("FORBIDDEN");
    });

    it("checks permission before the invitation exists (C148)", async () => {
      expect(await code(s.members.cancelInvitation(JOAO, s.sprint, MISSING))).toBe("FORBIDDEN");
    });
  });

  describe("member role", () => {
    it("promotes a member (CA18)", async () => {
      const state = await s.members.updateMember(CAIO, s.sprint, JOAO, { role: "admin" });
      expect(state.members.find((m) => m.userId === JOAO)?.role).toBe("admin");
      expect(await code(s.lists.create(JOAO, s.sprint, { name: "Nova", position: undefined }))).toBeUndefined();
    });

    it("lets an administrator demote themselves when another administrator exists (CA19)", async () => {
      const state = await s.members.updateMember(CAIO, s.sprint, CAIO, { role: "member" });
      expect(state.myRole).toBe("member");
    });

    it("accepts the same role without change (CB07)", async () => {
      const state = await s.members.updateMember(CAIO, s.sprint, JOAO, { role: "member" });
      expect(state.members.find((m) => m.userId === JOAO)?.role).toBe("member");
    });

    it("protects the last administrator on demote, remove and leave (CA20, RN04)", async () => {
      await s.members.updateMember(CAIO, s.sprint, MARINA, { role: "member" });
      expect(await code(s.members.updateMember(CAIO, s.sprint, CAIO, { role: "member" }))).toBe("LAST_ADMIN");
      expect(await code(s.members.removeMember(CAIO, s.sprint, CAIO))).toBe("LAST_ADMIN");
      expect(s.store.member(s.sprint, CAIO)?.role).toBe("admin");
    });

    it("ends with exactly one administrator on simultaneous demotions (CA21, N146)", async () => {
      const results = await Promise.allSettled([
        s.members.updateMember(CAIO, s.sprint, MARINA, { role: "member" }),
        s.members.updateMember(MARINA, s.sprint, CAIO, { role: "member" }),
      ]);
      const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
      expect(rejected).toHaveLength(1);
      // The second one is refused either as last admin or because its author was demoted first (RN06).
      expect(["LAST_ADMIN", "FORBIDDEN"]).toContain((rejected[0]?.reason as { code: string }).code);
      expect(s.store.membersOf(s.sprint).filter((m) => m.role === "admin")).toHaveLength(1);
    });

    it("answers MEMBER_NOT_FOUND for non participants and malformed ids (CB05, CB06)", async () => {
      expect(await code(s.members.updateMember(CAIO, s.sprint, BRUNO, { role: "admin" }))).toBe("MEMBER_NOT_FOUND");
      expect(await code(s.members.updateMember(CAIO, s.sprint, "abc", { role: "admin" }))).toBe("MEMBER_NOT_FOUND");
    });

    it("refuses members (CA25)", async () => {
      expect(await code(s.members.updateMember(JOAO, s.sprint, MARINA, { role: "member" }))).toBe("FORBIDDEN");
      expect(await code(s.members.updateMember(JOAO, s.sprint, JOAO, { role: "admin" }))).toBe("FORBIDDEN");
    });
  });

  describe("remove and leave", () => {
    it("removes a participant and their assignments, keeping their content (CA22, CA26, RN10)", async () => {
      s.store.assign(s.card, JOAO);
      await s.cards.create(JOAO, s.sprint, s.aFazer, { title: "Criado por João" });

      const state = await s.members.removeMember(CAIO, s.sprint, JOAO);
      expect("members" in state && state.members.map((m) => m.userId)).toEqual([CAIO, MARINA]);
      expect(s.store.assigneesOf(s.card)).toEqual([]);
      expect((await s.boards.get(CAIO, s.sprint)).lists[0]?.cards.map((c) => c.title)).toEqual([
        "Refatorar filtros",
        "Criado por João",
      ]);
      expect(await s.boards.list(JOAO)).toEqual([]);
      expect(await code(s.boards.get(JOAO, s.sprint))).toBe("BOARD_NOT_FOUND");
    });

    it("lets a member leave, answering { left: true } (CA24, C157)", async () => {
      expect(await s.members.removeMember(JOAO, s.sprint, JOAO)).toEqual({ left: true });
      expect(s.store.member(s.sprint, JOAO)).toBeUndefined();
    });

    it("refuses members removing others (CA25)", async () => {
      expect(await code(s.members.removeMember(JOAO, s.sprint, MARINA))).toBe("FORBIDDEN");
      expect(s.store.member(s.sprint, MARINA)).toBeDefined();
    });

    it("answers MEMBER_NOT_FOUND for someone already removed (CB17)", async () => {
      await s.members.removeMember(CAIO, s.sprint, JOAO);
      expect(await code(s.members.removeMember(CAIO, s.sprint, JOAO))).toBe("MEMBER_NOT_FOUND");
    });

    it("changes nothing when the removal fails midway (CE05)", async () => {
      s.store.assign(s.card, JOAO);
      s.memberRepo.failOn = "listMembers";
      await expect(s.members.removeMember(CAIO, s.sprint, JOAO)).rejects.toThrow();
      expect(s.store.member(s.sprint, JOAO)).toBeDefined();
      expect(s.store.assigneesOf(s.card).map((a) => a.userId)).toEqual([JOAO]);
    });

    it("loses access right after removal while the board is open (CA39)", async () => {
      await s.members.removeMember(CAIO, s.sprint, JOAO);
      expect(await code(s.cards.create(JOAO, s.sprint, s.aFazer, { title: "Tarde" }))).toBe("BOARD_NOT_FOUND");
    });
  });

  describe("board deletion", () => {
    it("removes members, invitations and assignments with the board (RN15)", async () => {
      s.store.assign(s.card, JOAO);
      await s.boards.delete(CAIO, s.sprint);
      expect(s.store.membersOf(s.sprint)).toEqual([]);
      expect(await s.invitations.list(ACCOUNTS.ana)).toEqual([]);
      expect(s.store.assignees.size).toBe(0);
    });
  });
});
