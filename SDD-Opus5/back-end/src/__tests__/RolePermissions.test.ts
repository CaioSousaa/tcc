import { beforeEach, describe, expect, it } from "vitest";
import { CAIO, JOAO, MARINA, code, sprintBoard } from "./helpers/sprintBoard";

type Scenario = Awaited<ReturnType<typeof sprintBoard>>;

/** RF07 RN05 applied to the services of RF02–RF06 (N158). */
describe("role permissions in board, list, card and checklist services", () => {
  let s: Scenario;

  beforeEach(async () => {
    s = await sprintBoard();
  });

  it("lets a member work on cards and checklists (CA27)", async () => {
    const { card } = await s.cards.create(JOAO, s.sprint, s.aFazer, { title: "Do João" });
    await s.cards.update(JOAO, s.sprint, card.id, { title: "Editado", description: "x", listId: s.concluido, position: 1, dueDate: null });
    const { item } = await s.checklist.add(JOAO, s.sprint, card.id, { text: "Item" });
    await s.checklist.update(JOAO, s.sprint, card.id, item.id, { text: undefined, done: true });
    await s.checklist.remove(JOAO, s.sprint, card.id, item.id);
    await s.cards.delete(JOAO, s.sprint, card.id);
    expect((await s.boards.get(JOAO, s.sprint)).lists.flatMap((l) => l.cards.map((c) => c.title))).toEqual(["Refatorar filtros"]);
  });

  it("refuses list management to a member and changes nothing (CA28)", async () => {
    const before = await s.boards.get(CAIO, s.sprint);
    expect(await code(s.lists.create(JOAO, s.sprint, { name: "Nova", position: undefined }))).toBe("FORBIDDEN");
    expect(await code(s.lists.update(JOAO, s.sprint, s.aFazer, { name: "Renomeada", position: 2 }))).toBe("FORBIDDEN");
    expect(await code(s.lists.delete(JOAO, s.sprint, s.concluido))).toBe("FORBIDDEN");
    expect(
      await code(s.lists.delete(JOAO, s.sprint, s.aFazer, { strategy: "cascade", targetListId: undefined, expectedCardCount: 1 })),
    ).toBe("FORBIDDEN");
    expect((await s.boards.get(CAIO, s.sprint)).lists).toEqual(before.lists);
  });

  it("refuses board edition, deletion lock and deletion to a member (CA28)", async () => {
    expect(await code(s.boards.update(JOAO, s.sprint, { name: "Hack", color: "amber" }))).toBe("FORBIDDEN");
    expect(await code(s.boards.update(JOAO, s.sprint, { name: "Sprint", color: "navy", lockListDeletion: true }))).toBe("FORBIDDEN");
    expect(await code(s.boards.delete(JOAO, s.sprint))).toBe("FORBIDDEN");
    expect(await s.boards.get(CAIO, s.sprint)).toMatchObject({ name: "Sprint", color: "navy", lockListDeletion: false });
  });

  it("checks the role before the list exists (C148)", async () => {
    expect(await code(s.lists.update(JOAO, s.sprint, "abc", { name: "X", position: undefined }))).toBe("FORBIDDEN");
  });

  it("lets an invited administrator manage (CA30)", async () => {
    await s.lists.create(MARINA, s.sprint, { name: "Revisão", position: undefined });
    await s.boards.update(MARINA, s.sprint, { name: "Sprint 2", color: "green" });
    await s.members.invite(MARINA, s.sprint, { email: "pedro@empresa.com", role: "member" });
    expect((await s.boards.get(CAIO, s.sprint)).name).toBe("Sprint 2");
  });

  it("uses the role at processing time after a demotion (CA40, RN06)", async () => {
    await s.lists.update(MARINA, s.sprint, s.aFazer, { name: "Antes", position: undefined });
    await s.members.updateMember(CAIO, s.sprint, MARINA, { role: "member" });
    expect(await code(s.lists.update(MARINA, s.sprint, s.aFazer, { name: "Depois", position: undefined }))).toBe("FORBIDDEN");
    expect((await s.boards.get(MARINA, s.sprint)).myRole).toBe("member");
  });

  it("keeps card, checklist and assignee actions after a demotion (CB14)", async () => {
    await s.members.updateMember(CAIO, s.sprint, MARINA, { role: "member" });
    await s.checklist.add(MARINA, s.sprint, s.card, { text: "Ok" });
    await s.assignees.assign(MARINA, s.sprint, s.card, MARINA);
    expect((await s.cards.get(MARINA, s.sprint, s.card)).assignees.map((a) => a.userId)).toEqual([MARINA]);
  });
});
