import { beforeEach, describe, expect, it } from "vitest";
import { AppError } from "../errors/AppError";
import type { CardTransaction } from "../repositories/BoardCardRepository";
import { BoardService } from "../services/BoardService";
import { CardService } from "../services/CardService";
import { ListService } from "../services/ListService";
import { InMemoryBoardCardRepository } from "./helpers/InMemoryBoardCardRepository";
import { InMemoryBoardListRepository } from "./helpers/InMemoryBoardListRepository";
import { InMemoryBoardLock } from "./helpers/InMemoryBoardLock";
import { InMemoryBoardRepository } from "./helpers/InMemoryBoardRepository";

const ANA = "11111111-1111-4111-8111-111111111111";
const BRUNO = "22222222-2222-4222-8222-222222222222";
const MISSING = "33333333-3333-4333-8333-333333333333";

async function code(promise: Promise<unknown>): Promise<string | undefined> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  return error instanceof AppError ? error.code : undefined;
}

describe("CardService", () => {
  let store: InMemoryBoardRepository;
  let cardsRepo: InMemoryBoardCardRepository;
  let cards: CardService;
  let lists: ListService;
  let boards: BoardService;
  let sprint: string;
  let aFazer: string;
  let emProgresso: string;
  let concluido: string;
  const ids: Record<string, string> = {};

  /** Titles per list, top to bottom. */
  const layout = async (boardId = sprint) =>
    Object.fromEntries((await boards.get(ANA, boardId)).lists.map((l) => [l.name, l.cards.map((c) => c.title)]));

  const positionsOk = async (boardId = sprint) => {
    for (const list of (await boards.get(ANA, boardId)).lists) {
      expect(list.cards.map((c) => c.position)).toEqual(list.cards.map((_, i) => i + 1));
      expect(list.cardCount).toBe(list.cards.length);
    }
  };

  beforeEach(async () => {
    store = new InMemoryBoardRepository();
    const lock = new InMemoryBoardLock(store);
    cardsRepo = new InMemoryBoardCardRepository(store, lock);
    cards = new CardService(cardsRepo);
    lists = new ListService(new InMemoryBoardListRepository(store, lock));
    boards = new BoardService(store);

    const board = await boards.create(ANA, { name: "Sprint", color: "navy", withDefaultLists: true });
    sprint = board.id;
    [aFazer, emProgresso, concluido] = board.lists.map((l) => l.id) as [string, string, string];
    for (const title of ["C1", "C2", "C3"]) ids[title] = store.addCard(aFazer, title);
    ids.P1 = store.addCard(emProgresso, "P1");
  });

  const save = (
    title: string,
    changes: { title?: string; description?: string | null; listId?: string; position?: number; dueDate?: string | null },
  ) =>
    cards.update(ANA, sprint, ids[title] ?? "", {
      title: changes.title ?? title,
      description: changes.description ?? null,
      listId: changes.listId,
      position: changes.position,
      dueDate: changes.dueDate ?? null,
    });

  describe("display", () => {
    it("returns cards per list in order with matching counts (CA01, CA02, RN17)", async () => {
      const board = await boards.get(ANA, sprint);
      expect(board.lists.map((l) => [l.name, l.cardCount, l.cards.map((c) => c.title)])).toEqual([
        ["A fazer", 3, ["C1", "C2", "C3"]],
        ["Em progresso", 1, ["P1"]],
        ["Concluído", 0, []],
      ]);
      expect(Object.keys(board.lists[0]?.cards[0] ?? {}).sort()).toEqual(["assigneeIds", "checklistDone", "checklistTotal", "commentCount", "dueDate", "id", "labelIds", "position", "title"]);
    });
  });

  describe("create", () => {
    it("adds at the end and returns the affected list (CA06, RN07, C81)", async () => {
      const result = await cards.create(ANA, sprint, aFazer, { title: "C4" });
      expect(result.card).toMatchObject({ title: "C4", position: 4 });
      expect(result.lists.map((l) => [l.name, l.cardCount, l.cards.map((c) => c.title)])).toEqual([
        ["A fazer", 4, ["C1", "C2", "C3", "C4"]],
      ]);
    });

    it("adds in sequence to an empty list (CA07)", async () => {
      await cards.create(ANA, sprint, concluido, { title: "D1" });
      await cards.create(ANA, sprint, concluido, { title: "D2" });
      expect((await layout())["Concluído"]).toEqual(["D1", "D2"]);
    });

    it("creates without description (spec 2.2)", async () => {
      const { card } = await cards.create(ANA, sprint, aFazer, { title: "C4" });
      expect((await cards.get(ANA, sprint, card.id)).description).toBeNull();
    });

    it("allows repeated titles (CA15, RN05)", async () => {
      await cards.create(ANA, sprint, aFazer, { title: "C1" });
      expect((await layout())["A fazer"]).toEqual(["C1", "C2", "C3", "C1"]);
    });

    it("updates the board card count in the listing (CA16)", async () => {
      await cards.create(ANA, sprint, aFazer, { title: "C4" });
      expect((await boards.list(ANA))[0]?.cardCount).toBe(5);
    });

    it("keeps positions contiguous with concurrent creations (CB13, RN06)", async () => {
      await Promise.all(Array.from({ length: 10 }, (_, i) => cards.create(ANA, sprint, aFazer, { title: `N${i}` })));
      expect((await layout())["A fazer"]).toHaveLength(13);
      await positionsOk();
    });
  });

  describe("get", () => {
    it("returns the full card for the dialog (CA17)", async () => {
      await save("C2", { description: "Detalhes" });
      expect(await cards.get(ANA, sprint, ids.C2 ?? "")).toMatchObject({
        title: "C2",
        description: "Detalhes",
        listId: aFazer,
        position: 2,
      });
    });

    it("answers a missing or malformed card with CARD_NOT_FOUND (plan risk: opening a deleted card)", async () => {
      expect(await code(cards.get(ANA, sprint, MISSING))).toBe("CARD_NOT_FOUND");
      expect(await code(cards.get(ANA, sprint, "abc"))).toBe("CARD_NOT_FOUND");
    });
  });

  describe("edit", () => {
    it("edits title and description in place (CA19, CA20)", async () => {
      const result = await save("C1", { title: "Tarefa 1", description: "Linha 1\nLinha 2" });
      expect(result.card).toMatchObject({ title: "Tarefa 1", description: "Linha 1\nLinha 2", position: 1, listId: aFazer });
      expect((await layout())["A fazer"]).toEqual(["Tarefa 1", "C2", "C3"]);
    });

    it("clears the description (CA21)", async () => {
      await save("C2", { description: "Detalhes" });
      await save("C2", { description: null });
      expect((await cards.get(ANA, sprint, ids.C2 ?? "")).description).toBeNull();
    });

    it("saves without changes and moves nothing (CA25)", async () => {
      const before = await layout();
      await cards.update(ANA, sprint, ids.C2 ?? "", { title: "C2", description: null, listId: aFazer, position: 2, dueDate: null });
      expect(await layout()).toEqual(before);
      expect(cardsRepo.calls[cardsRepo.calls.length - 1]).not.toContain("moveWithinList");
    });
  });

  describe("move", () => {
    it("moves to the end of another list (CA26, RN09)", async () => {
      const result = await save("C2", { listId: emProgresso });
      expect(await layout()).toMatchObject({ "A fazer": ["C1", "C3"], "Em progresso": ["P1", "C2"] });
      expect(result.lists.map((l) => [l.name, l.cardCount])).toEqual([
        ["A fazer", 2],
        ["Em progresso", 2],
      ]);
      await positionsOk();
    });

    it("moves to a chosen position of another list (CA28)", async () => {
      await save("C3", { listId: emProgresso, position: 1 });
      expect(await layout()).toMatchObject({ "A fazer": ["C1", "C2"], "Em progresso": ["C3", "P1"] });
      await positionsOk();
    });

    it("moves to an empty list (CA29)", async () => {
      await save("C1", { listId: concluido, position: 1 });
      expect(await layout()).toEqual({ "A fazer": ["C2", "C3"], "Em progresso": ["P1"], Concluído: ["C1"] });
      await positionsOk();
    });

    it("reorders down and up within the same list (CA30, CA31, RN08)", async () => {
      await save("C1", { position: 3 });
      expect((await layout())["A fazer"]).toEqual(["C2", "C3", "C1"]);
      await save("C1", { position: 1 });
      expect((await layout())["A fazer"]).toEqual(["C1", "C2", "C3"]);
    });

    it("edits and moves at once (CA32)", async () => {
      await save("C1", { title: "Iniciado", listId: emProgresso, position: 1 });
      expect(await layout()).toMatchObject({ "A fazer": ["C2", "C3"], "Em progresso": ["Iniciado", "P1"] });
    });

    it("preserves content and identity when moving (CA33, RN13)", async () => {
      await save("C2", { description: "Detalhes" });
      await save("C2", { listId: concluido, description: "Detalhes" });
      expect(await cards.get(ANA, sprint, ids.C2 ?? "")).toMatchObject({
        id: ids.C2,
        title: "C2",
        description: "Detalhes",
        listId: concluido,
      });
    });

    it("keeps the position when none is given in the same list, end when moving (CB12)", async () => {
      expect((await cards.update(ANA, sprint, ids.C2 ?? "", { title: "C2", description: null, listId: undefined, position: undefined, dueDate: null })).card.position).toBe(2);
      expect((await cards.update(ANA, sprint, ids.C1 ?? "", { title: "C1", description: null, listId: emProgresso, position: undefined, dueDate: null })).card.position).toBe(2);
    });

    it("clamps positions beyond the maximum (RN10, CB18)", async () => {
      expect((await save("C1", { position: 99 })).card.position).toBe(3);
      expect((await save("C2", { listId: emProgresso, position: 99 })).card.position).toBe(2);
    });

    it("never produces a duplicate position in any intermediate statement (F40, N87)", async () => {
      // The in-memory repository throws on any duplicate after each primitive, like the deferrable UNIQUE.
      await save("C1", { listId: emProgresso, position: 1 });
      await save("P1", { listId: aFazer, position: 1 });
      await save("C3", { listId: concluido, position: 1 });
      await positionsOk();
    });

    it("frees the source list for deletion once it is empty (CA34, RN17)", async () => {
      expect(await code(lists.delete(ANA, sprint, emProgresso))).toBe("LIST_DELETION_STRATEGY_REQUIRED");
      await save("P1", { listId: concluido });
      await expect(lists.delete(ANA, sprint, emProgresso)).resolves.toBeDefined();
    });
  });

  describe("delete", () => {
    it("removes the card and closes the gap (CA36, RN11)", async () => {
      const result = await cards.delete(ANA, sprint, ids.C2 ?? "");
      expect(result.lists.map((l) => [l.name, l.cardCount, l.cards.map((c) => [c.title, c.position])])).toEqual([
        ["A fazer", 2, [["C1", 1], ["C3", 2]]],
      ]);
    });

    it("answers a second deletion as CARD_NOT_FOUND; the client treats it as success (CA38, RN15)", async () => {
      await cards.delete(ANA, sprint, ids.C2 ?? "");
      expect(await code(cards.delete(ANA, sprint, ids.C2 ?? ""))).toBe("CARD_NOT_FOUND");
      expect((await layout())["A fazer"]).toEqual(["C1", "C3"]);
    });
  });

  describe("protection", () => {
    it("answers every operation on another account's board with BOARD_NOT_FOUND (CA39)", async () => {
      const beta = await boards.create(BRUNO, { name: "Beta", color: "navy", withDefaultLists: true });
      const x = beta.lists[0]?.id ?? "";
      const k = store.addCard(x, "K");

      expect(await code(cards.create(ANA, beta.id, x, { title: "Hack" }))).toBe("BOARD_NOT_FOUND");
      expect(await code(cards.get(ANA, beta.id, k))).toBe("BOARD_NOT_FOUND");
      expect(await code(cards.update(ANA, beta.id, k, { title: "Hack", description: null, listId: x, position: 1, dueDate: null }))).toBe("BOARD_NOT_FOUND");
      expect(await code(cards.delete(ANA, beta.id, k))).toBe("BOARD_NOT_FOUND");
      expect(await code(cards.delete(ANA, beta.id, "not-a-uuid"))).toBe("BOARD_NOT_FOUND");
      expect((await boards.get(BRUNO, beta.id)).lists[0]?.cards.map((c) => c.title)).toEqual(["K"]);
    });

    it("refuses a card that belongs to another board of the same user (CA40)", async () => {
      const outro = await boards.create(ANA, { name: "Outro", color: "navy", withDefaultLists: true });
      const y = store.addCard(outro.lists[0]?.id ?? "", "Y");

      expect(await code(cards.get(ANA, sprint, y))).toBe("CARD_NOT_FOUND");
      expect(await code(cards.update(ANA, sprint, y, { title: "Hack", description: null, listId: aFazer, position: 1, dueDate: null }))).toBe("CARD_NOT_FOUND");
      expect(await code(cards.delete(ANA, sprint, y))).toBe("CARD_NOT_FOUND");
      expect((await layout(outro.id))["A fazer"]).toEqual(["Y"]);
    });

    it("refuses a destination list from another board (CA41)", async () => {
      const outro = await boards.create(ANA, { name: "Outro", color: "navy", withDefaultLists: true });
      const z = outro.lists[0]?.id ?? "";

      expect(await code(cards.create(ANA, sprint, z, { title: "Hack" }))).toBe("LIST_NOT_FOUND");
      expect(await code(save("C1", { listId: z }))).toBe("LIST_NOT_FOUND");
      expect(await code(save("C1", { listId: "not-a-uuid" }))).toBe("LIST_NOT_FOUND");
      expect((await layout())["A fazer"]).toEqual(["C1", "C2", "C3"]);
      expect((await layout(outro.id))["A fazer"]).toEqual([]);
    });

    it("checks the card before the destination list (C71)", async () => {
      expect(await code(cards.update(ANA, sprint, MISSING, { title: "X", description: null, listId: MISSING, position: 1, dueDate: null }))).toBe("CARD_NOT_FOUND");
    });

    it("reports a list deleted elsewhere when adding (CB19)", async () => {
      await lists.delete(ANA, sprint, concluido);
      expect(await code(cards.create(ANA, sprint, concluido, { title: "D1" }))).toBe("LIST_NOT_FOUND");
    });

    it("reports a deleted board (CB20)", async () => {
      await boards.delete(ANA, sprint);
      expect(await code(cards.create(ANA, sprint, aFazer, { title: "X" }))).toBe("BOARD_NOT_FOUND");
    });
  });

  describe("atomicity and cost", () => {
    it.each(["updateContent", "openGap", "relocate", "closeGap"] as const)(
      "rolls back content and both lists when %s fails during a move (CE04, RN12)",
      async (primitive: keyof CardTransaction) => {
        const before = await boards.get(ANA, sprint);
        cardsRepo.failOn = primitive;
        await expect(save("C1", { title: "Mudou", description: "d", listId: emProgresso, position: 1 })).rejects.toThrow();
        cardsRepo.failOn = null;
        expect(await boards.get(ANA, sprint)).toEqual(before);
        expect((await cards.get(ANA, sprint, ids.C1 ?? "")).description).toBeNull();
      },
    );

    it("uses a constant number of primitives per move regardless of card count (N67)", async () => {
      for (let i = 0; i < 30; i += 1) store.addCard(emProgresso, `E${i}`);
      await save("C1", { listId: emProgresso, position: 5 });
      await save("C2", { listId: emProgresso, position: 20 });
      const [first, second] = cardsRepo.calls.slice(-2);
      expect(first?.length).toBe(second?.length);
    });
  });

  describe("invariant", () => {
    function random(seed: number) {
      let state = seed;
      return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    it("keeps every list at positions 1..N with the expected cards after 400 random operations (N88)", async () => {
      const next = random(4042026);
      const listIds = [aFazer, emProgresso, concluido];
      const expected = new Map<string, string[]>();
      for (const list of (await boards.get(ANA, sprint)).lists) expected.set(list.id, list.cards.map((c) => c.id));
      const pick = <T>(items: T[]) => items[Math.floor(next() * items.length)] as T;

      for (let step = 0; step < 400; step += 1) {
        const all = [...expected.entries()].flatMap(([listId, cardIds]) => cardIds.map((id) => ({ id, listId })));
        const roll = next();

        if (all.length === 0 || roll < 0.35) {
          const listId = pick(listIds);
          const { card } = await cards.create(ANA, sprint, listId, { title: `S${step}` });
          expected.get(listId)?.push(card.id);
        } else if (roll < 0.85) {
          const { id, listId: from } = pick(all);
          const to = next() < 0.5 ? from : pick(listIds);
          const source = expected.get(from) ?? [];
          const target = expected.get(to) ?? [];
          const max = to === from ? source.length : target.length + 1;
          const position = 1 + Math.floor(next() * (max + 2));
          await cards.update(ANA, sprint, id, { title: `M${step}`, description: null, listId: to, position, dueDate: null });

          source.splice(source.indexOf(id), 1);
          target.splice(Math.min(position, max) - 1, 0, id);
        } else {
          const { id, listId } = pick(all);
          await cards.delete(ANA, sprint, id);
          const bucket = expected.get(listId) ?? [];
          bucket.splice(bucket.indexOf(id), 1);
        }

        const board = await boards.get(ANA, sprint);
        for (const list of board.lists) {
          expect(list.cards.map((c) => c.id)).toEqual(expected.get(list.id));
        }
        await positionsOk();
      }
    });
  });
});
