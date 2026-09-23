import { beforeEach, describe, expect, it } from "vitest";
import { BRUNO, CAIO, JOAO, code, sprintBoard } from "./helpers/sprintBoard";

async function labelBoard() {
  const s = await sprintBoard();
  const corrigir = s.store.addCard(s.aFazer, "Corrigir login");
  const docs = s.store.addCard(s.aFazer, "Escrever docs");
  const bug = (await s.labels.create(CAIO, s.sprint, { name: "Bug", color: "red" })).label.id;
  const frontend = (await s.labels.create(CAIO, s.sprint, { name: "Frontend", color: "blue" })).label.id;
  const urgente = (await s.labels.create(CAIO, s.sprint, { name: "Urgente", color: "amber" })).label.id;
  s.store.applyLabel(s.card, frontend);
  s.store.applyLabel(s.card, urgente);
  s.store.applyLabel(corrigir, bug);
  return { ...s, corrigir, docs, L: { bug, frontend, urgente } };
}

describe("CardLabelService (RF08)", () => {
  let s: Awaited<ReturnType<typeof labelBoard>>;

  const usage = (labels: Array<{ name: string; usage: number }>) => labels.map((label) => `${label.name}:${label.usage}`);

  beforeEach(async () => {
    s = await labelBoard();
  });

  it("lets a member apply, updating usage and the face without saving the card (CA20)", async () => {
    const result = await s.cardLabels.apply(JOAO, s.sprint, s.docs, s.L.bug);
    expect(result.labelIds).toEqual([s.L.bug]);
    expect(usage(result.labels)).toEqual(["Bug:2", "Frontend:1", "Urgente:1"]);
    const face = (await s.boards.get(JOAO, s.sprint)).lists[0]?.cards.find((card) => card.id === s.docs);
    expect(face?.labelIds).toEqual([s.L.bug]);
  });

  it("removes a label (CA21)", async () => {
    const result = await s.cardLabels.remove(CAIO, s.sprint, s.card, s.L.urgente);
    expect(result.labelIds).toEqual([s.L.frontend]);
    expect(usage(result.labels)).toContain("Urgente:0");
  });

  it("keeps the label order whatever the order of application (CA22, RN11)", async () => {
    await s.cardLabels.apply(CAIO, s.sprint, s.docs, s.L.urgente);
    const { labelIds } = await s.cardLabels.apply(CAIO, s.sprint, s.docs, s.L.bug);
    expect(labelIds).toEqual([s.L.bug, s.L.urgente]);
  });

  it("is idempotent in both directions (RN07, CB11)", async () => {
    await Promise.all([
      s.cardLabels.apply(CAIO, s.sprint, s.docs, s.L.bug),
      s.cardLabels.apply(JOAO, s.sprint, s.docs, s.L.bug),
    ]);
    expect(s.store.cardLabelIdsOf(s.docs)).toEqual([s.L.bug]);
    expect((await s.cardLabels.remove(CAIO, s.sprint, s.docs, s.L.frontend)).labelIds).toEqual([s.L.bug]);
  });

  it("does not touch title, list, position, checklist or assignees (RN07)", async () => {
    const before = await s.cards.get(CAIO, s.sprint, s.card);
    await s.cardLabels.remove(CAIO, s.sprint, s.card, s.L.frontend);
    const after = await s.cards.get(CAIO, s.sprint, s.card);
    expect({ ...after, labelIds: before.labelIds }).toEqual(before);
  });

  it("refuses labels of another board, malformed or missing (CA36, CB05)", async () => {
    const infra = await s.boards.create(CAIO, { name: "Infra", color: "green", withDefaultLists: false });
    const foreign = (await s.labels.create(CAIO, infra.id, { name: "Bug", color: "red" })).label.id;
    expect(await code(s.cardLabels.apply(CAIO, s.sprint, s.docs, foreign))).toBe("LABEL_NOT_FOUND");
    expect(await code(s.cardLabels.apply(CAIO, s.sprint, s.docs, "abc"))).toBe("LABEL_NOT_FOUND");
    expect(s.store.cardLabelIdsOf(s.docs)).toEqual([]);
  });

  it("answers LABEL_NOT_FOUND after the label was deleted elsewhere (CA37, CB12)", async () => {
    await s.labels.delete(CAIO, s.sprint, s.L.bug);
    expect(await code(s.cardLabels.apply(JOAO, s.sprint, s.docs, s.L.bug))).toBe("LABEL_NOT_FOUND");
    expect(await code(s.cardLabels.remove(JOAO, s.sprint, s.corrigir, s.L.bug))).toBe("LABEL_NOT_FOUND");
  });

  it("never leaves an application of a label deleted during the write (N171)", async () => {
    s.cardLabelRepo.deleteLabelBeforeApply = s.L.bug;
    expect(await code(s.cardLabels.apply(CAIO, s.sprint, s.docs, s.L.bug))).toBe("LABEL_NOT_FOUND");
    expect([...s.store.cardLabels.values()].some((row) => row.labelId === s.L.bug)).toBe(false);
  });

  it("checks board, then card, then label (F98, CB06, CA35)", async () => {
    expect(await code(s.cardLabels.apply(BRUNO, s.sprint, "abc", "def"))).toBe("BOARD_NOT_FOUND");
    expect(await code(s.cardLabels.apply(CAIO, s.sprint, "abc", "def"))).toBe("CARD_NOT_FOUND");
    const other = await s.boards.create(BRUNO, { name: "Outro", color: "amber", withDefaultLists: false });
    const foreignCard = s.store.addCard(s.store.addList(other.id, "L"), "Alheio");
    expect(await code(s.cardLabels.apply(CAIO, s.sprint, foreignCard, s.L.bug))).toBe("CARD_NOT_FOUND");
  });

  it("keeps labels when the card moves and drops applications when it is deleted (CA24, RN12)", async () => {
    await s.cards.update(CAIO, s.sprint, s.card, { title: "Refatorar filtros", description: null, listId: s.concluido, position: undefined, dueDate: null });
    expect((await s.cards.get(CAIO, s.sprint, s.card)).labelIds).toEqual([s.L.frontend, s.L.urgente]);

    await s.lists.delete(CAIO, s.sprint, s.aFazer, { strategy: "move", targetListId: s.concluido, expectedCardCount: 2 });
    expect((await s.cards.get(CAIO, s.sprint, s.card)).labelIds).toEqual([s.L.frontend, s.L.urgente]);

    await s.cards.delete(CAIO, s.sprint, s.card);
    expect(usage(await s.labels.list(CAIO, s.sprint))).toEqual(["Bug:1", "Frontend:0", "Urgente:0"]);
  });

  it("removes applications with a list deleted in cascade (RN12)", async () => {
    await s.lists.delete(CAIO, s.sprint, s.aFazer, { strategy: "cascade", targetListId: undefined, expectedCardCount: 3 });
    expect(s.store.cardLabels.size).toBe(0);
  });
});
