import { beforeEach, describe, expect, it } from "vitest";
import { BRUNO, CAIO, JOAO, code, sprintBoard } from "./helpers/sprintBoard";

const TODAY = "2026-08-29";

/** Scenario of RF10 section 3 on top of the RF07 "Sprint" board ("Refatorar filtros" already in "A fazer"). */
async function dueDateBoard() {
  const s = await sprintBoard();
  const refatorar = s.card;
  s.store.cards.get(refatorar)!.dueDate = "2026-08-27";
  const convite = s.store.addCard(s.aFazer, "Convite de membros", null, "2026-09-03");
  const migrar = s.store.addCard(s.aFazer, "Migrar cards", null, "2026-08-31");
  const docs = s.store.addCard(s.aFazer, "Escrever docs");
  const ajustar = s.store.addCard(s.concluido, "Ajustar layout", null, "2026-08-28");
  return { ...s, refatorar, convite, migrar, docs, ajustar };
}

describe("due dates (RF10)", () => {
  let s: Awaited<ReturnType<typeof dueDateBoard>>;

  const save = (userId: string, cardId: string, dueDate: string | null, title = "Card", listId?: string) =>
    s.cards.update(userId, s.sprint, cardId, { title, description: null, listId, position: undefined, dueDate });

  const faceDue = async (cardId: string) =>
    (await s.boards.get(CAIO, s.sprint)).lists.flatMap((list) => list.cards).find((card) => card.id === cardId)?.dueDate;

  const overdue = async (userId = CAIO, today: string | null = TODAY) =>
    (await s.boards.list(userId, today)).find((board) => board.id === s.sprint)?.overdueCount;

  beforeEach(async () => {
    s = await dueDateBoard();
  });

  describe("reading", () => {
    it("returns the saved date on the face and in the card, never a status (CA01, CA05, F138)", async () => {
      expect(await faceDue(s.refatorar)).toBe("2026-08-27");
      expect(await faceDue(s.docs)).toBeNull();
      const card = await s.cards.get(JOAO, s.sprint, s.refatorar);
      expect(card.dueDate).toBe("2026-08-27");
      expect(Object.keys(card)).not.toContain("dueStatus");
    });
  });

  describe("saving", () => {
    it("saves, changes and removes the due date with 'Salvar card' (CA08, CA10, CA11)", async () => {
      const { card, lists } = await save(CAIO, s.docs, "2026-09-10", "Escrever docs");
      expect(card.dueDate).toBe("2026-09-10");
      expect(lists.flatMap((list) => list.cards).find((c) => c.id === s.docs)?.dueDate).toBe("2026-09-10");
      await save(CAIO, s.refatorar, "2026-09-02", "Refatorar filtros");
      expect(await faceDue(s.refatorar)).toBe("2026-09-02");
      await save(CAIO, s.refatorar, null, "Refatorar filtros");
      expect(await faceDue(s.refatorar)).toBeNull();
    });

    it("lets a member set a due date (CA09, RN05)", async () => {
      await save(JOAO, s.docs, "2026-09-10");
      expect(await faceDue(s.docs)).toBe("2026-09-10");
    });

    it("accepts a date in the past (CA13)", async () => {
      await save(CAIO, s.docs, "2026-08-01");
      expect(await faceDue(s.docs)).toBe("2026-08-01");
    });

    it("saves title and due date together (CA15)", async () => {
      const { card } = await save(CAIO, s.docs, "2026-09-10", "Escrever documentação");
      expect(card).toMatchObject({ title: "Escrever documentação", dueDate: "2026-09-10" });
    });

    it("saves nothing when the save fails midway (RN04, CE01)", async () => {
      s.cardRepo.failOn = "relocate";
      await expect(save(CAIO, s.migrar, "2026-09-15", "Migrar cards", s.concluido)).rejects.toThrow();
      s.cardRepo.failOn = null;
      expect(await faceDue(s.migrar)).toBe("2026-08-31");
    });

    it("lets the last save win (CA29, RN10)", async () => {
      await Promise.all([save(CAIO, s.migrar, "2026-09-05", "Migrar cards"), save(JOAO, s.migrar, "2026-09-07", "Migrar cards")]);
      expect(await faceDue(s.migrar)).toBe("2026-09-07");
    });

    it("keeps the due date when the card moves or its list is deleted moving cards (CA16, RN08)", async () => {
      await save(CAIO, s.refatorar, "2026-08-27", "Refatorar filtros", s.concluido);
      expect(await faceDue(s.refatorar)).toBe("2026-08-27");
      await s.lists.delete(CAIO, s.sprint, s.aFazer, { strategy: "move", targetListId: s.concluido, expectedCardCount: 3 });
      expect(await faceDue(s.convite)).toBe("2026-09-03");
    });

    it("answers BOARD_NOT_FOUND to non participants and CARD_NOT_FOUND for deleted cards (CA28, CA30)", async () => {
      expect(await code(save(BRUNO, s.docs, "2026-09-10"))).toBe("BOARD_NOT_FOUND");
      await s.cards.delete(CAIO, s.sprint, s.migrar);
      expect(await code(save(JOAO, s.migrar, "2026-09-07"))).toBe("CARD_NOT_FOUND");
    });
  });

  describe("overdue count in the listing (RN07)", () => {
    it("counts cards before the viewer's today across lists (CA25)", async () => {
      expect(await overdue()).toBe(2);
    });

    it("drops to 1 and to 0, never counting a due date of today (CA26, CA27)", async () => {
      await save(CAIO, s.ajustar, null, "Ajustar layout");
      expect(await overdue()).toBe(1);
      await save(CAIO, s.refatorar, TODAY, "Refatorar filtros");
      expect(await overdue()).toBe(0);
    });

    it("follows the day informed by the client (RN02, CA04)", async () => {
      expect(await overdue(CAIO, "2026-09-05")).toBe(4);
      expect(await overdue(CAIO, "2026-08-27")).toBe(0);
    });

    it("is returned with the accepted invitation using the same today (A70)", async () => {
      const { invitations } = await s.members.invite(CAIO, s.sprint, { email: "bruno@empresa.com", role: "member" });
      const board = await s.invitations.accept({ id: BRUNO, email: "bruno@empresa.com" }, invitations[0]?.id ?? "", TODAY);
      expect(board.overdueCount).toBe(2);
    });
  });
});
