import { beforeEach, describe, expect, it } from "vitest";
import type { ListDeletionRequest } from "../domain/listDeletion";
import { AppError } from "../errors/AppError";
import type { ListTransaction } from "../repositories/BoardListRepository";
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

async function failure(promise: Promise<unknown>): Promise<AppError | undefined> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  return error instanceof AppError ? error : undefined;
}

const move = (targetListId: string, expectedCardCount: number): ListDeletionRequest => ({
  strategy: "move",
  targetListId,
  expectedCardCount,
});
const cascade = (expectedCardCount: number): ListDeletionRequest => ({
  strategy: "cascade",
  targetListId: undefined,
  expectedCardCount,
});

describe("List deletion with cards (RF05)", () => {
  let store: InMemoryBoardRepository;
  let listRepo: InMemoryBoardListRepository;
  let lists: ListService;
  let cards: CardService;
  let boards: BoardService;
  let sprint: string;
  const L: Record<string, string> = {};
  const C: Record<string, string> = {};

  /** Titles per list, in board order. */
  const layout = async (boardId = sprint) =>
    (await boards.get(ANA, boardId)).lists.map((l) => [l.name, l.cards.map((c) => c.title)] as const);

  const positionsOk = async (boardId = sprint) => {
    const board = await boards.get(ANA, boardId);
    expect(board.lists.map((l) => l.position)).toEqual(board.lists.map((_, i) => i + 1));
    for (const list of board.lists) expect(list.cards.map((c) => c.position)).toEqual(list.cards.map((_, i) => i + 1));
  };

  const setLock = (locked: boolean) =>
    boards.update(ANA, sprint, { name: "Sprint", color: "navy", lockListDeletion: locked });

  beforeEach(async () => {
    store = new InMemoryBoardRepository();
    const lock = new InMemoryBoardLock(store);
    listRepo = new InMemoryBoardListRepository(store, lock);
    lists = new ListService(listRepo);
    cards = new CardService(new InMemoryBoardCardRepository(store, lock));
    boards = new BoardService(store);

    sprint = (await boards.create(ANA, { name: "Sprint", color: "navy", withDefaultLists: false })).id;
    for (const name of ["Backlog", "A fazer", "Revisão", "Concluído"]) {
      L[name] = (await lists.create(ANA, sprint, { name, position: undefined })).list.id;
    }
    for (const title of ["C1", "C2", "C3"]) C[title] = store.addCard(L["A fazer"] ?? "", title);
    for (const title of ["R1", "R2", "R3", "R4"]) C[title] = store.addCard(L.Revisão ?? "", title, title === "R2" ? "Detalhes" : null);
    C.D1 = store.addCard(L.Concluído ?? "", "D1");
  });

  describe("board lock setting", () => {
    it("starts off for new boards, even if the client sends it (CA01, CA02)", async () => {
      expect((await boards.get(ANA, sprint)).lockListDeletion).toBe(false);
    });

    it("is turned on without touching lists or cards (CA03)", async () => {
      const before = await layout();
      const summary = await setLock(true);
      expect(summary.lockListDeletion).toBe(true);
      expect(await layout()).toEqual(before);
    });

    it("keeps the current value when the edit omits it (CB09)", async () => {
      await setLock(true);
      await boards.update(ANA, sprint, { name: "Sprint 2", color: "green" });
      expect((await boards.get(ANA, sprint)).lockListDeletion).toBe(true);
    });

    it("cannot be changed on another account's board (CA29)", async () => {
      const beta = await boards.create(BRUNO, { name: "Beta", color: "navy", withDefaultLists: true });
      expect((await failure(boards.update(ANA, beta.id, { name: "Beta", color: "navy", lockListDeletion: true })))?.code).toBe(
        "BOARD_NOT_FOUND",
      );
      expect((await boards.get(BRUNO, beta.id)).lockListDeletion).toBe(false);
    });
  });

  describe("empty list", () => {
    it("is deleted without a rule (CA05, RN02)", async () => {
      const result = await lists.delete(ANA, sprint, L.Backlog ?? "");
      expect(result.lists.map((l) => l.name)).toEqual(["A fazer", "Revisão", "Concluído"]);
    });

    it("is deleted with the lock on (CA06, CA21)", async () => {
      await setLock(true);
      await expect(lists.delete(ANA, sprint, L.Backlog ?? "")).resolves.toBeDefined();
    });

    it("ignores a rule sent for a list that is empty now (CA24, CB07)", async () => {
      await cards.update(ANA, sprint, C.D1 ?? "", { title: "D1", description: null, listId: L["A fazer"], position: undefined, dueDate: null });
      await lists.delete(ANA, sprint, L.Concluído ?? "", move(MISSING, 1));
      expect(await layout()).toEqual([
        ["Backlog", []],
        ["A fazer", ["C1", "C2", "C3", "D1"]],
        ["Revisão", ["R1", "R2", "R3", "R4"]],
      ]);
    });
  });

  describe("move", () => {
    it("appends the cards in order to the chosen list and removes the list (CA12, RN06)", async () => {
      const result = await lists.delete(ANA, sprint, L.Revisão ?? "", move(L.Concluído ?? "", 4));
      expect(result.lists.map((l) => [l.name, l.position, l.cardCount, l.cards.map((c) => c.title)])).toEqual([
        ["Backlog", 1, 0, []],
        ["A fazer", 2, 3, ["C1", "C2", "C3"]],
        ["Concluído", 3, 5, ["D1", "R1", "R2", "R3", "R4"]],
      ]);
      await positionsOk();
    });

    it("moves into an empty list (CA13)", async () => {
      await lists.delete(ANA, sprint, L.Revisão ?? "", move(L.Backlog ?? "", 4));
      expect((await layout())[0]).toEqual(["Backlog", ["R1", "R2", "R3", "R4"]]);
    });

    it("preserves identity and content of each card (CA14, CA15, F55)", async () => {
      await lists.delete(ANA, sprint, L.Revisão ?? "", move(L["A fazer"] ?? "", 4));
      const r2 = await cards.get(ANA, sprint, C.R2 ?? "");
      expect(r2).toMatchObject({ id: C.R2, title: "R2", description: "Detalhes", listId: L["A fazer"], position: 5 });
      expect((await cards.get(ANA, sprint, C.R4 ?? "")).position).toBe(7);
    });

    it("keeps the destination cards where they were (RN06)", async () => {
      await lists.delete(ANA, sprint, L.Revisão ?? "", move(L["A fazer"] ?? "", 4));
      expect((await cards.get(ANA, sprint, C.C1 ?? "")).position).toBe(1);
      expect((await cards.get(ANA, sprint, C.C3 ?? "")).position).toBe(3);
    });

    it("refuses the list itself as destination (CA31, CB05)", async () => {
      const error = await failure(lists.delete(ANA, sprint, L.Revisão ?? "", move(L.Revisão ?? "", 4)));
      expect(error?.code).toBe("VALIDATION_ERROR");
      expect(error?.fields).toEqual({ targetListId: "Selecione outra lista de destino." });
    });

    it("refuses a destination that does not exist, is malformed or belongs to another board (CA26, CA30, CB04)", async () => {
      const outro = await boards.create(ANA, { name: "Outro", color: "navy", withDefaultLists: true });
      for (const target of [MISSING, "not-a-uuid", outro.lists[0]?.id ?? ""]) {
        expect((await failure(lists.delete(ANA, sprint, L.Revisão ?? "", move(target, 4))))?.code).toBe("TARGET_LIST_NOT_FOUND");
      }
      expect((await layout()).map(([name]) => name)).toEqual(["Backlog", "A fazer", "Revisão", "Concluído"]);
      expect((await boards.get(ANA, outro.id)).lists.every((l) => l.cardCount === 0)).toBe(true);
    });
  });

  describe("cascade", () => {
    it("deletes the list and its cards, leaving other lists intact (CA16, RN07)", async () => {
      await lists.delete(ANA, sprint, L.Revisão ?? "", cascade(4));
      expect(await layout()).toEqual([
        ["Backlog", []],
        ["A fazer", ["C1", "C2", "C3"]],
        ["Concluído", ["D1"]],
      ]);
      await positionsOk();
    });

    it("updates the board listing counts (CA17)", async () => {
      await lists.delete(ANA, sprint, L.Revisão ?? "", cascade(4));
      expect((await boards.list(ANA))[0]).toMatchObject({ listCount: 3, cardCount: 4 });
    });

    it("makes deleted cards unreachable (CA18)", async () => {
      await lists.delete(ANA, sprint, L.Revisão ?? "", cascade(4));
      expect((await failure(cards.get(ANA, sprint, C.R1 ?? "")))?.code).toBe("CARD_NOT_FOUND");
      expect((await failure(cards.delete(ANA, sprint, C.R1 ?? "")))?.code).toBe("CARD_NOT_FOUND");
    });

    it("deletes the only list of a board (CA10)", async () => {
      const solo = (await boards.create(ANA, { name: "Solo", color: "navy", withDefaultLists: false })).id;
      const unica = (await lists.create(ANA, solo, { name: "Única", position: undefined })).list.id;
      store.addCard(unica, "U1");
      store.addCard(unica, "U2");
      expect((await lists.delete(ANA, solo, unica, cascade(2))).lists).toEqual([]);
    });
  });

  describe("lock and conditions", () => {
    it("refuses any rule with the lock on and keeps everything (CA20, RN03)", async () => {
      await setLock(true);
      for (const request of [move(L.Concluído ?? "", 4), cascade(4)]) {
        expect((await failure(lists.delete(ANA, sprint, L.Revisão ?? "", request)))?.code).toBe("LIST_DELETION_LOCKED");
      }
      expect((await layout())[2]).toEqual(["Revisão", ["R1", "R2", "R3", "R4"]]);
    });

    it("works again once the lock is turned off (CA22)", async () => {
      await setLock(true);
      await setLock(false);
      await expect(lists.delete(ANA, sprint, L.Revisão ?? "", cascade(4))).resolves.toBeDefined();
    });

    it("requires a rule and a count for a list with cards (RN01, CB01, CB06)", async () => {
      for (const request of [
        { strategy: undefined, targetListId: undefined, expectedCardCount: 4 },
        { strategy: "cascade" as const, targetListId: undefined, expectedCardCount: undefined },
      ]) {
        expect((await failure(lists.delete(ANA, sprint, L.Revisão ?? "", request)))?.code).toBe("LIST_DELETION_STRATEGY_REQUIRED");
      }
    });

    it("refuses when the number of cards changed, then succeeds with the new count (CA23, RN08)", async () => {
      store.addCard(L.Revisão ?? "", "R5");
      expect((await failure(lists.delete(ANA, sprint, L.Revisão ?? "", cascade(4))))?.code).toBe("LIST_CARD_COUNT_CHANGED");
      expect((await layout())[2]?.[1]).toHaveLength(5);
      await lists.delete(ANA, sprint, L.Revisão ?? "", cascade(5));
      expect((await layout()).map(([name]) => name)).toEqual(["Backlog", "A fazer", "Concluído"]);
    });

    it("treats a list deleted elsewhere as not found; the client treats it as done (CA27, RN12)", async () => {
      await lists.delete(ANA, sprint, L.Revisão ?? "", cascade(4));
      expect((await failure(lists.delete(ANA, sprint, L.Revisão ?? "", cascade(4))))?.code).toBe("LIST_NOT_FOUND");
    });

    it("answers another account's board with BOARD_NOT_FOUND for every rule (CA29)", async () => {
      const beta = await boards.create(BRUNO, { name: "Beta", color: "navy", withDefaultLists: true });
      const x = beta.lists[0]?.id ?? "";
      store.addCard(x, "K");
      for (const request of [cascade(1), move(beta.lists[1]?.id ?? "", 1)]) {
        expect((await failure(lists.delete(ANA, beta.id, x, request)))?.code).toBe("BOARD_NOT_FOUND");
      }
      expect((await boards.get(BRUNO, beta.id)).lists[0]?.cardCount).toBe(1);
    });

    it("checks in the mandatory order: list, empty, lock, rule, count, target (C95)", async () => {
      await setLock(true);
      // Lock wins over a missing rule, a wrong count and a bad target.
      expect((await failure(lists.delete(ANA, sprint, L.Revisão ?? "", move(MISSING, 99))))?.code).toBe("LIST_DELETION_LOCKED");
      await setLock(false);
      // Wrong count wins over a bad target.
      expect((await failure(lists.delete(ANA, sprint, L.Revisão ?? "", move(MISSING, 99))))?.code).toBe("LIST_CARD_COUNT_CHANGED");
      // Missing list wins over everything.
      expect((await failure(lists.delete(ANA, sprint, MISSING, move(MISSING, 99))))?.code).toBe("LIST_NOT_FOUND");
    });
  });

  describe("atomicity and cost", () => {
    it.each(["appendCards", "remove", "shiftLeft"] as const)(
      "rolls back cards, lists and positions when %s fails (CE02, RN09)",
      async (primitive: keyof ListTransaction) => {
        const before = await boards.get(ANA, sprint);
        listRepo.failOn = primitive;
        await expect(lists.delete(ANA, sprint, L.Revisão ?? "", move(L.Concluído ?? "", 4))).rejects.toThrow();
        listRepo.failOn = null;
        expect(await boards.get(ANA, sprint)).toEqual(before);
      },
    );

    it("uses the same number of primitives for 4 or 300 cards (N90, CB10)", async () => {
      await lists.delete(ANA, sprint, L.Revisão ?? "", move(L.Concluído ?? "", 4));
      for (let i = 0; i < 300; i += 1) store.addCard(L["A fazer"] ?? "", `X${i}`);
      await lists.delete(ANA, sprint, L["A fazer"] ?? "", move(L.Backlog ?? "", 303));
      const [small, large] = listRepo.calls.slice(-2);
      expect(small?.length).toBe(large?.length);
      await positionsOk();
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

    it("keeps positions 1..N and every surviving card id after 300 random operations (N109)", async () => {
      const next = random(5052026);
      const pick = <T>(items: readonly T[]) => items[Math.floor(next() * items.length)] as T;

      for (let step = 0; step < 300; step += 1) {
        const board = await boards.get(ANA, sprint);
        const roll = next();

        if (board.lists.length < 2 || roll < 0.25) {
          await lists.create(ANA, sprint, { name: `L${step}`, position: 1 + Math.floor(next() * (board.lists.length + 1)) });
        } else if (roll < 0.6) {
          const list = pick(board.lists);
          await cards.create(ANA, sprint, list.id, { title: `S${step}` });
        } else if (roll < 0.8) {
          const list = pick(board.lists);
          const target = pick(board.lists.filter((l) => l.id !== list.id));
          const expected = [...target.cards.map((c) => c.id), ...list.cards.map((c) => c.id)];
          await lists.delete(ANA, sprint, list.id, move(target.id, list.cardCount));
          const after = (await boards.get(ANA, sprint)).lists.find((l) => l.id === target.id);
          expect(after?.cards.map((c) => c.id)).toEqual(expected);
        } else {
          const list = pick(board.lists);
          const survivors = board.lists.filter((l) => l.id !== list.id).flatMap((l) => l.cards.map((c) => c.id));
          await lists.delete(ANA, sprint, list.id, cascade(list.cardCount));
          const after = (await boards.get(ANA, sprint)).lists.flatMap((l) => l.cards.map((c) => c.id));
          expect(after.sort()).toEqual(survivors.sort());
        }

        await positionsOk();
      }
    });
  });
});
