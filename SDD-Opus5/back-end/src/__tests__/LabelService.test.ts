import { beforeEach, describe, expect, it } from "vitest";
import { LABELS_MAX } from "../domain/labels";
import { BRUNO, CAIO, JOAO, MARINA, code, sprintBoard } from "./helpers/sprintBoard";

type Scenario = Awaited<ReturnType<typeof sprintBoard>>;

/** Scenario of RF08 section 3 on top of the RF07 "Sprint" board. */
async function labelBoard() {
  const s = await sprintBoard();
  const corrigir = s.store.addCard(s.aFazer, "Corrigir login");
  const docs = s.store.addCard(s.aFazer, "Escrever docs");
  const layout = s.store.addCard(s.concluido, "Ajustar layout");
  const bug = (await s.labels.create(CAIO, s.sprint, { name: "Bug", color: "red" })).label.id;
  const frontend = (await s.labels.create(CAIO, s.sprint, { name: "Frontend", color: "blue" })).label.id;
  const urgente = (await s.labels.create(CAIO, s.sprint, { name: "Urgente", color: "amber" })).label.id;
  s.store.applyLabel(s.card, frontend);
  s.store.applyLabel(s.card, urgente);
  s.store.applyLabel(corrigir, bug);
  s.store.applyLabel(layout, frontend);
  return { ...s, corrigir, docs, layout, L: { bug, frontend, urgente } };
}

describe("LabelService (RF08)", () => {
  let s: Scenario & Awaited<ReturnType<typeof labelBoard>>;

  const summary = async (userId = CAIO) =>
    (await s.labels.list(userId, s.sprint)).map((label) => `${label.name}:${label.color}:${label.usage}`);

  beforeEach(async () => {
    s = await labelBoard();
  });

  describe("list", () => {
    it("returns labels in creation order with usage (CA05, RN11)", async () => {
      expect(await summary(JOAO)).toEqual(["Bug:red:1", "Frontend:blue:2", "Urgente:amber:1"]);
    });

    it("comes with the board and with each card (CA01, CA02, CA03)", async () => {
      const board = await s.boards.get(JOAO, s.sprint);
      expect(board.labels.map((label) => label.name)).toEqual(["Bug", "Frontend", "Urgente"]);
      const refatorar = board.lists[0]?.cards.find((card) => card.id === s.card);
      expect(refatorar?.labelIds).toEqual([s.L.frontend, s.L.urgente]);
      expect((await s.cards.get(JOAO, s.sprint, s.docs)).labelIds).toEqual([]);
    });

    it("answers BOARD_NOT_FOUND to non participants (CA35)", async () => {
      expect(await code(s.labels.list(BRUNO, s.sprint))).toBe("BOARD_NOT_FOUND");
    });
  });

  describe("create", () => {
    it("adds at the end with usage 0 (CA06)", async () => {
      const { label, labels } = await s.labels.create(CAIO, s.sprint, { name: "UX", color: "purple" });
      expect(label).toMatchObject({ name: "UX", color: "purple", usage: 0 });
      expect(labels.map((item) => item.name)).toEqual(["Bug", "Frontend", "Urgente", "UX"]);
    });

    it("refuses a repeated name regardless of case (CA09, RN04)", async () => {
      expect(await code(s.labels.create(CAIO, s.sprint, { name: "bug", color: "blue" }))).toBe("LABEL_NAME_TAKEN");
      expect(await code(s.labels.create(CAIO, s.sprint, { name: "BUG", color: "red" }))).toBe("LABEL_NAME_TAKEN");
      expect(await summary()).toHaveLength(3);
    });

    it("translates the unique index into LABEL_NAME_TAKEN (F104)", async () => {
      s.labelRepo.skipNameCheck = true;
      expect(await code(s.labels.create(CAIO, s.sprint, { name: "bug", color: "blue" }))).toBe("LABEL_NAME_TAKEN");
      expect(await summary()).toHaveLength(3);
    });

    it("allows the same name in another board and repeated colors (CA10, RN02)", async () => {
      const infra = await s.boards.create(CAIO, { name: "Infra", color: "green", withDefaultLists: false });
      await s.labels.create(CAIO, infra.id, { name: "Bug", color: "red" });
      await s.labels.create(CAIO, s.sprint, { name: "Hotfix", color: "red" });
      expect((await s.labels.list(CAIO, infra.id)).map((label) => label.name)).toEqual(["Bug"]);
      expect(await summary()).toContain("Hotfix:red:0");
    });

    it("refuses members and changes nothing (CA12, RN05)", async () => {
      expect(await code(s.labels.create(JOAO, s.sprint, { name: "UX", color: "purple" }))).toBe("FORBIDDEN");
      expect(await summary()).toHaveLength(3);
    });

    it("lets an invited administrator create", async () => {
      await s.labels.create(MARINA, s.sprint, { name: "UX", color: "purple" });
      expect(await summary()).toHaveLength(4);
    });

    it("stops at 50 labels (CA38, RN06)", async () => {
      for (let i = 3; i < LABELS_MAX; i += 1) await s.labels.create(CAIO, s.sprint, { name: `L${i}`, color: "gray" });
      expect(await code(s.labels.create(CAIO, s.sprint, { name: "Extra", color: "gray" }))).toBe("LABEL_LIMIT_REACHED");
      expect(await summary()).toHaveLength(LABELS_MAX);
    });

    it("never goes over the limit with simultaneous creations at 49 (CB10, N169)", async () => {
      for (let i = 3; i < LABELS_MAX - 1; i += 1) await s.labels.create(CAIO, s.sprint, { name: `L${i}`, color: "gray" });
      const results = await Promise.allSettled([
        s.labels.create(CAIO, s.sprint, { name: "A", color: "red" }),
        s.labels.create(MARINA, s.sprint, { name: "B", color: "red" }),
      ]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(await summary()).toHaveLength(LABELS_MAX);
    });

    it("creates only one of two simultaneous labels with the same name (CB09)", async () => {
      const results = await Promise.allSettled([
        s.labels.create(CAIO, s.sprint, { name: "UX", color: "red" }),
        s.labels.create(MARINA, s.sprint, { name: "ux", color: "blue" }),
      ]);
      const rejected = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
      expect(rejected).toHaveLength(1);
      expect((rejected[0]?.reason as { code: string }).code).toBe("LABEL_NAME_TAKEN");
    });
  });

  describe("update", () => {
    it("changes name and color everywhere, keeping the order (CA13, RN11)", async () => {
      const { label, labels } = await s.labels.update(CAIO, s.sprint, s.L.frontend, { name: "Front", color: "green" });
      expect(label).toMatchObject({ name: "Front", color: "green", usage: 2 });
      expect(labels.map((item) => item.name)).toEqual(["Bug", "Front", "Urgente"]);
      expect((await s.cards.get(CAIO, s.sprint, s.layout)).labelIds).toEqual([s.L.frontend]);
    });

    it("refuses the name of another label (CA14)", async () => {
      expect(await code(s.labels.update(CAIO, s.sprint, s.L.frontend, { name: "urgente", color: "blue" }))).toBe("LABEL_NAME_TAKEN");
      expect(await summary()).toContain("Frontend:blue:2");
    });

    it("accepts changing only the case of its own name and saving unchanged (CA15, CB08)", async () => {
      await s.labels.update(CAIO, s.sprint, s.L.bug, { name: "BUG", color: "red" });
      await s.labels.update(CAIO, s.sprint, s.L.bug, { name: "BUG", color: "red" });
      expect(await summary()).toContain("BUG:red:1");
    });

    it("answers LABEL_NOT_FOUND for missing, malformed or foreign labels (CB05)", async () => {
      const other = await s.boards.create(BRUNO, { name: "Outro", color: "amber", withDefaultLists: false });
      const foreign = (await s.labels.create(BRUNO, other.id, { name: "X", color: "red" })).label.id;
      expect(await code(s.labels.update(CAIO, s.sprint, foreign, { name: "Y", color: "red" }))).toBe("LABEL_NOT_FOUND");
      expect(await code(s.labels.update(CAIO, s.sprint, "abc", { name: "Y", color: "red" }))).toBe("LABEL_NOT_FOUND");
    });

    it("refuses members, even before checking the label (CA19, F98)", async () => {
      expect(await code(s.labels.update(JOAO, s.sprint, s.L.bug, { name: "B", color: "red" }))).toBe("FORBIDDEN");
      expect(await code(s.labels.update(JOAO, s.sprint, "abc", { name: "B", color: "red" }))).toBe("FORBIDDEN");
    });

    it("lets the last edition win (CB17)", async () => {
      await Promise.all([
        s.labels.update(CAIO, s.sprint, s.L.bug, { name: "Erro", color: "red" }),
        s.labels.update(MARINA, s.sprint, s.L.bug, { name: "Defeito", color: "gray" }),
      ]);
      expect(await summary()).toContain("Defeito:gray:1");
    });
  });

  describe("delete", () => {
    it("removes the label from every card without deleting cards (CA17, RN10)", async () => {
      const { labels } = await s.labels.delete(CAIO, s.sprint, s.L.frontend);
      expect(labels.map((label) => label.name)).toEqual(["Bug", "Urgente"]);
      expect((await s.cards.get(CAIO, s.sprint, s.card)).labelIds).toEqual([s.L.urgente]);
      expect((await s.cards.get(CAIO, s.sprint, s.layout)).labelIds).toEqual([]);
    });

    it("answers LABEL_NOT_FOUND for a second deletion (CB12)", async () => {
      await s.labels.delete(CAIO, s.sprint, s.L.bug);
      expect(await code(s.labels.delete(CAIO, s.sprint, s.L.bug))).toBe("LABEL_NOT_FOUND");
    });

    it("refuses members (CA19)", async () => {
      expect(await code(s.labels.delete(JOAO, s.sprint, s.L.bug))).toBe("FORBIDDEN");
      expect(await summary()).toHaveLength(3);
    });

    it("changes nothing when the deletion fails midway (CE04)", async () => {
      s.labelRepo.failOn = "listLabels";
      await expect(s.labels.delete(CAIO, s.sprint, s.L.frontend)).rejects.toThrow();
      s.labelRepo.failOn = null;
      expect(await summary()).toContain("Frontend:blue:2");
      expect((await s.cards.get(CAIO, s.sprint, s.layout)).labelIds).toEqual([s.L.frontend]);
    });

    it("goes with the board (RN12)", async () => {
      await s.boards.delete(CAIO, s.sprint);
      expect(s.store.labels.size).toBe(0);
      expect(s.store.cardLabels.size).toBe(0);
    });

    it("loses the permission after a demotion (CB14)", async () => {
      await s.members.updateMember(CAIO, s.sprint, MARINA, { role: "member" });
      expect(await code(s.labels.delete(MARINA, s.sprint, s.L.bug))).toBe("FORBIDDEN");
    });
  });
});
