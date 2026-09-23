import { beforeEach, describe, expect, it } from "vitest";
import { ANA, BRUNO, CAIO, JOAO, MARINA, PEDRO, code, sprintBoard } from "./helpers/sprintBoard";

type Scenario = Awaited<ReturnType<typeof sprintBoard>>;

describe("AssigneeService (RF07)", () => {
  let s: Scenario;

  const face = async () => (await s.boards.get(CAIO, s.sprint)).lists.flatMap((l) => l.cards).find((c) => c.id === s.card);

  beforeEach(async () => {
    s = await sprintBoard();
  });

  it("assigns and shows the assignee on the card and its face (CA31)", async () => {
    const { assignees } = await s.assignees.assign(CAIO, s.sprint, s.card, JOAO);
    expect(assignees).toEqual([{ userId: JOAO, name: "João Pereira" }]);
    expect((await face())?.assigneeIds).toEqual([JOAO]);
    expect((await s.cards.get(CAIO, s.sprint, s.card)).assignees).toEqual(assignees);
  });

  it("keeps the order of assignment (RN13)", async () => {
    await s.assignees.assign(CAIO, s.sprint, s.card, MARINA);
    await s.assignees.assign(CAIO, s.sprint, s.card, CAIO);
    expect((await face())?.assigneeIds).toEqual([MARINA, CAIO]);
  });

  it("removes an assignee (CA33)", async () => {
    await s.assignees.assign(CAIO, s.sprint, s.card, JOAO);
    expect((await s.assignees.unassign(CAIO, s.sprint, s.card, JOAO)).assignees).toEqual([]);
    expect((await face())?.assigneeIds).toEqual([]);
  });

  it("lets a member assign (CA34, RN05)", async () => {
    expect((await s.assignees.assign(JOAO, s.sprint, s.card, MARINA)).assignees.map((a) => a.userId)).toEqual([MARINA]);
  });

  it("is idempotent in both directions (RN11, CB16)", async () => {
    await Promise.all([s.assignees.assign(CAIO, s.sprint, s.card, JOAO), s.assignees.assign(MARINA, s.sprint, s.card, JOAO)]);
    expect(s.store.assigneesOf(s.card)).toHaveLength(1);
    await s.assignees.unassign(CAIO, s.sprint, s.card, MARINA);
    await s.assignees.unassign(CAIO, s.sprint, s.card, "abc");
    expect(s.store.assigneesOf(s.card).map((a) => a.userId)).toEqual([JOAO]);
  });

  it("refuses people who do not participate, including pending invitations (CA36, CA32)", async () => {
    expect(await code(s.assignees.assign(CAIO, s.sprint, s.card, BRUNO))).toBe("ASSIGNEE_NOT_MEMBER");
    expect(await code(s.assignees.assign(CAIO, s.sprint, s.card, ANA))).toBe("ASSIGNEE_NOT_MEMBER");
    expect(await code(s.assignees.assign(CAIO, s.sprint, s.card, "abc"))).toBe("ASSIGNEE_NOT_MEMBER");
    expect(await code(s.assignees.assign(CAIO, s.sprint, s.card, PEDRO))).toBe("ASSIGNEE_NOT_MEMBER");
    expect(s.store.assigneesOf(s.card)).toEqual([]);
  });

  it("checks board, then card (C148)", async () => {
    expect(await code(s.assignees.assign(BRUNO, s.sprint, "abc", JOAO))).toBe("BOARD_NOT_FOUND");
    expect(await code(s.assignees.assign(CAIO, s.sprint, "abc", JOAO))).toBe("CARD_NOT_FOUND");
    const other = await s.boards.create(BRUNO, { name: "Outro", color: "amber", withDefaultLists: false });
    const foreignCard = s.store.addCard(s.store.addList(other.id, "L"), "Alheio");
    expect(await code(s.assignees.assign(CAIO, s.sprint, foreignCard, JOAO))).toBe("CARD_NOT_FOUND");
  });

  it("keeps assignees when the card moves and drops them when it is deleted (CA38)", async () => {
    await s.assignees.assign(CAIO, s.sprint, s.card, JOAO);
    await s.cards.update(CAIO, s.sprint, s.card, { title: "Refatorar filtros", description: null, listId: s.concluido, position: undefined, dueDate: null });
    expect((await s.cards.get(CAIO, s.sprint, s.card)).assignees.map((a) => a.userId)).toEqual([JOAO]);

    await s.lists.delete(CAIO, s.sprint, s.concluido, { strategy: "move", targetListId: s.aFazer, expectedCardCount: 1 });
    expect((await s.cards.get(CAIO, s.sprint, s.card)).assignees.map((a) => a.userId)).toEqual([JOAO]);

    await s.cards.delete(CAIO, s.sprint, s.card);
    expect(s.store.assignees.size).toBe(0);
  });
});
