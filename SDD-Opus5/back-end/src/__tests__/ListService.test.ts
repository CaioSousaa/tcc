import { beforeEach, describe, expect, it } from "vitest";
import { AppError } from "../errors/AppError";
import { BoardService } from "../services/BoardService";
import { ListService } from "../services/ListService";
import { InMemoryBoardListRepository } from "./helpers/InMemoryBoardListRepository";
import { InMemoryBoardRepository } from "./helpers/InMemoryBoardRepository";

const ANA = "11111111-1111-4111-8111-111111111111";
const BRUNO = "22222222-2222-4222-8222-222222222222";
const MISSING_LIST = "33333333-3333-4333-8333-333333333333";

type Ctx = {
  store: InMemoryBoardRepository;
  repository: InMemoryBoardListRepository;
  lists: ListService;
  boards: BoardService;
};

function context(): Ctx {
  const store = new InMemoryBoardRepository();
  const repository = new InMemoryBoardListRepository(store);
  return { store, repository, lists: new ListService(repository), boards: new BoardService(store) };
}

async function code(promise: Promise<unknown>): Promise<string | undefined> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  return error instanceof AppError ? error.code : undefined;
}

function expectContiguous(positions: number[]) {
  expect(positions).toEqual(positions.map((_, index) => index + 1));
}

describe("ListService", () => {
  let ctx: Ctx;
  let sprint: string;

  const names = async (boardId = sprint) => (await ctx.boards.get(ANA, boardId)).lists.map((l) => l.name);
  const idOf = async (name: string, boardId = sprint) => {
    const list = (await ctx.boards.get(ANA, boardId)).lists.find((l) => l.name === name);
    if (!list) throw new Error(`list ${name} not found`);
    return list.id;
  };

  beforeEach(async () => {
    ctx = context();
    sprint = (await ctx.boards.create(ANA, { name: "Sprint", color: "navy", withDefaultLists: true })).id;
  });

  describe("display", () => {
    it("returns lists in order with card counts (CA01, CA02)", async () => {
      ctx.store.addCard(await idOf("Em progresso"));
      ctx.store.addCard(await idOf("Em progresso"));

      const board = await ctx.boards.get(ANA, sprint);
      expect(board.lists.map((l) => [l.name, l.position, l.cardCount])).toEqual([
        ["A fazer", 1, 0],
        ["Em progresso", 2, 2],
        ["Concluído", 3, 0],
      ]);
    });
  });

  describe("create", () => {
    it("adds at the end by default and returns the whole saved order (CA07, CB07, C56)", async () => {
      const result = await ctx.lists.create(ANA, sprint, { name: "Arquivo", position: undefined });

      expect(result.list).toMatchObject({ name: "Arquivo", position: 4, cardCount: 0 });
      expect(result.lists.map((l) => l.name)).toEqual(["A fazer", "Em progresso", "Concluído", "Arquivo"]);
    });

    it("adds in the middle, pushing later lists right (CA08, RN06)", async () => {
      const result = await ctx.lists.create(ANA, sprint, { name: "Revisão", position: 3 });
      expect(result.lists.map((l) => [l.name, l.position])).toEqual([
        ["A fazer", 1],
        ["Em progresso", 2],
        ["Revisão", 3],
        ["Concluído", 4],
      ]);
    });

    it("adds at the start (CA09)", async () => {
      await ctx.lists.create(ANA, sprint, { name: "Backlog", position: 1 });
      expect(await names()).toEqual(["Backlog", "A fazer", "Em progresso", "Concluído"]);
    });

    it("creates the first list of an empty board (CA10)", async () => {
      const empty = (await ctx.boards.create(ANA, { name: "Vazio", color: "navy", withDefaultLists: false })).id;
      const result = await ctx.lists.create(ANA, empty, { name: "A fazer", position: 1 });
      expect(result.lists).toEqual([expect.objectContaining({ name: "A fazer", position: 1 })]);
    });

    it("clamps a position beyond N+1 to the end (RN09, CB13)", async () => {
      const result = await ctx.lists.create(ANA, sprint, { name: "Longe", position: 99 });
      expect(result.list.position).toBe(4);
    });

    it("allows repeated names (CA14, RN04)", async () => {
      const result = await ctx.lists.create(ANA, sprint, { name: "A fazer", position: undefined });
      expect(result.lists.filter((l) => l.name === "A fazer")).toHaveLength(2);
    });

    it("updates the board list count seen by the board listing (CA17, RN16)", async () => {
      await ctx.lists.create(ANA, sprint, { name: "Arquivo", position: undefined });
      const [summary] = await ctx.boards.list(ANA);
      expect(summary?.listCount).toBe(4);
    });

    it("keeps positions contiguous with concurrent creations (CB12, RN05)", async () => {
      await Promise.all(
        Array.from({ length: 10 }, (_, i) => ctx.lists.create(ANA, sprint, { name: `L${i}`, position: 2 })),
      );
      const board = await ctx.boards.get(ANA, sprint);
      expect(board.lists).toHaveLength(13);
      expectContiguous(board.lists.map((l) => l.position));
    });
  });

  describe("update", () => {
    it("renames without moving (CA19)", async () => {
      const result = await ctx.lists.update(ANA, sprint, await idOf("Em progresso"), { name: "Fazendo", position: 2 });
      expect(result.lists.map((l) => l.name)).toEqual(["A fazer", "Fazendo", "Concluído"]);
      expect(result.list).toMatchObject({ name: "Fazendo", position: 2 });
    });

    it("moves right (CA20, RN07)", async () => {
      await ctx.lists.update(ANA, sprint, await idOf("A fazer"), { name: "A fazer", position: 3 });
      expect(await names()).toEqual(["Em progresso", "Concluído", "A fazer"]);
    });

    it("moves left (CA21, RN07)", async () => {
      await ctx.lists.update(ANA, sprint, await idOf("Concluído"), { name: "Concluído", position: 1 });
      expect(await names()).toEqual(["Concluído", "A fazer", "Em progresso"]);
    });

    it("renames and moves at once (CA22)", async () => {
      await ctx.lists.update(ANA, sprint, await idOf("A fazer"), { name: "Backlog", position: 2 });
      expect(await names()).toEqual(["Em progresso", "Backlog", "Concluído"]);
    });

    it("accepts saving without changes and does not move anything (CA24)", async () => {
      const before = (await ctx.boards.get(ANA, sprint)).lists;
      const id = await idOf("Em progresso");
      await ctx.lists.update(ANA, sprint, id, { name: "Em progresso", position: 2 });
      expect((await ctx.boards.get(ANA, sprint)).lists).toEqual(before);
      expect(ctx.repository.calls[ctx.repository.calls.length - 1]).not.toContain("move");
    });

    it("keeps the position when none is given (CB08)", async () => {
      const result = await ctx.lists.update(ANA, sprint, await idOf("A fazer"), { name: "Backlog", position: undefined });
      expect(result.list.position).toBe(1);
    });

    it("clamps a position beyond N (RN09, CB13, CB16)", async () => {
      const result = await ctx.lists.update(ANA, sprint, await idOf("A fazer"), { name: "A fazer", position: 42 });
      expect(result.list.position).toBe(3);
      expect(result.lists.map((l) => l.name)).toEqual(["Em progresso", "Concluído", "A fazer"]);
    });

    it("preserves the cards of a moved list (CA27)", async () => {
      const id = await idOf("A fazer");
      for (let i = 0; i < 3; i += 1) ctx.store.addCard(id);
      const result = await ctx.lists.update(ANA, sprint, id, { name: "Backlog", position: 3 });
      expect(result.list).toMatchObject({ id, cardCount: 3, position: 3 });
    });

    it("answers a list deleted elsewhere as LIST_NOT_FOUND (CB14)", async () => {
      const id = await idOf("Em progresso");
      await ctx.lists.delete(ANA, sprint, id);
      expect(await code(ctx.lists.update(ANA, sprint, id, { name: "X", position: 1 }))).toBe("LIST_NOT_FOUND");
    });
  });

  describe("delete", () => {
    it("removes an empty list and closes the gap (CA29, RN08)", async () => {
      const result = await ctx.lists.delete(ANA, sprint, await idOf("Em progresso"));
      expect(result.lists.map((l) => [l.name, l.position])).toEqual([
        ["A fazer", 1],
        ["Concluído", 2],
      ]);
    });

    it("leaves positions 1..N for the next operations (CA30)", async () => {
      await ctx.lists.delete(ANA, sprint, await idOf("A fazer"));
      const board = await ctx.boards.get(ANA, sprint);
      expect(board.lists.map((l) => [l.name, l.position])).toEqual([
        ["Em progresso", 1],
        ["Concluído", 2],
      ]);
    });

    it("refuses to delete a list with cards without a rule and changes nothing (RF05 RN01, CB01)", async () => {
      const id = await idOf("Em progresso");
      ctx.store.addCard(id);
      ctx.store.addCard(id);

      expect(await code(ctx.lists.delete(ANA, sprint, id))).toBe("LIST_DELETION_STRATEGY_REQUIRED");
      expect(await names()).toEqual(["A fazer", "Em progresso", "Concluído"]);
      expect(ctx.store.cardsIn(id)).toBe(2);
    });

    it("deletes the last remaining list (CA34)", async () => {
      const solo = (await ctx.boards.create(ANA, { name: "Solo", color: "navy", withDefaultLists: false })).id;
      const { list } = await ctx.lists.create(ANA, solo, { name: "Única", position: undefined });
      const result = await ctx.lists.delete(ANA, solo, list.id);
      expect(result.lists).toEqual([]);
    });

    it("answers a second deletion as LIST_NOT_FOUND; the client treats it as success (CA32, RN15, A33)", async () => {
      const id = await idOf("Em progresso");
      await ctx.lists.delete(ANA, sprint, id);
      expect(await code(ctx.lists.delete(ANA, sprint, id))).toBe("LIST_NOT_FOUND");
      expect(await names()).toEqual(["A fazer", "Concluído"]);
    });
  });

  describe("protection", () => {
    it("answers every operation on another account's board as BOARD_NOT_FOUND and changes nothing (CA35)", async () => {
      const beta = (await ctx.boards.create(BRUNO, { name: "Beta", color: "navy", withDefaultLists: true })).id;
      const x = (await ctx.boards.get(BRUNO, beta)).lists[0]?.id ?? "";

      expect(await code(ctx.lists.create(ANA, beta, { name: "Hack", position: 1 }))).toBe("BOARD_NOT_FOUND");
      expect(await code(ctx.lists.update(ANA, beta, x, { name: "Hack", position: 3 }))).toBe("BOARD_NOT_FOUND");
      expect(await code(ctx.lists.delete(ANA, beta, x))).toBe("BOARD_NOT_FOUND");
      expect(await code(ctx.lists.delete(ANA, beta, "not-a-uuid"))).toBe("BOARD_NOT_FOUND");

      expect((await ctx.boards.get(BRUNO, beta)).lists.map((l) => l.name)).toEqual(["A fazer", "Em progresso", "Concluído"]);
    });

    it("refuses a list that belongs to another board of the same user (CA36)", async () => {
      const outro = (await ctx.boards.create(ANA, { name: "Outro", color: "navy", withDefaultLists: false })).id;
      const { list: y } = await ctx.lists.create(ANA, outro, { name: "Y", position: undefined });

      expect(await code(ctx.lists.update(ANA, sprint, y.id, { name: "Hack", position: 1 }))).toBe("LIST_NOT_FOUND");
      expect(await code(ctx.lists.delete(ANA, sprint, y.id))).toBe("LIST_NOT_FOUND");
      expect(await names(outro)).toEqual(["Y"]);
      expect(await names()).toEqual(["A fazer", "Em progresso", "Concluído"]);
    });

    it("answers a malformed or missing list id in an accessible board as LIST_NOT_FOUND (F24)", async () => {
      expect(await code(ctx.lists.update(ANA, sprint, "abc", { name: "X", position: 1 }))).toBe("LIST_NOT_FOUND");
      expect(await code(ctx.lists.delete(ANA, sprint, MISSING_LIST))).toBe("LIST_NOT_FOUND");
    });

    it("rejects operations on a deleted board (CB17)", async () => {
      await ctx.boards.delete(ANA, sprint);
      expect(await code(ctx.lists.create(ANA, sprint, { name: "X", position: undefined }))).toBe("BOARD_NOT_FOUND");
    });
  });

  describe("atomicity and cost", () => {
    it.each(["insert", "move", "shiftLeft"] as const)(
      "rolls everything back when %s fails (CE03, RN10)",
      async (primitive) => {
        const before = (await ctx.boards.get(ANA, sprint)).lists;
        ctx.repository.failOn = primitive;
        const first = await idOf("A fazer");

        const attempt =
          primitive === "insert"
            ? ctx.lists.create(ANA, sprint, { name: "Novo", position: 1 })
            : primitive === "move"
              ? ctx.lists.update(ANA, sprint, first, { name: "Renomeada", position: 3 })
              : ctx.lists.delete(ANA, sprint, first);

        await expect(attempt).rejects.toThrow();
        ctx.repository.failOn = null;
        expect((await ctx.boards.get(ANA, sprint)).lists).toEqual(before);
      },
    );

    it("uses a constant number of primitive calls regardless of list count (N44)", async () => {
      for (let i = 0; i < 20; i += 1) await ctx.lists.create(ANA, sprint, { name: `L${i}`, position: 1 });
      const sizes = ctx.repository.calls.map((calls) => calls.length);
      expect(new Set(sizes)).toEqual(new Set([sizes[0]]));
    });
  });

  describe("invariant", () => {
    // Deterministic PRNG (mulberry32) so failures are reproducible (N65).
    function random(seed: number) {
      let state = seed;
      return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    it("keeps positions exactly 1..N and names intact after 300 random operations (RN05–RN08)", async () => {
      const next = random(20260916);
      const pick = <T>(items: T[]) => items[Math.floor(next() * items.length)];
      let expected = (await ctx.boards.get(ANA, sprint)).lists.map((l) => l.id);

      for (let step = 0; step < 300; step += 1) {
        const current = (await ctx.boards.get(ANA, sprint)).lists;
        const roll = next();

        if (current.length === 0 || roll < 0.4) {
          const position = 1 + Math.floor(next() * (current.length + 3));
          const { list } = await ctx.lists.create(ANA, sprint, { name: `S${step}`, position });
          const index = Math.min(position, expected.length + 1) - 1;
          expected.splice(index, 0, list.id);
        } else if (roll < 0.75) {
          const target = pick(current);
          if (!target) continue;
          const position = 1 + Math.floor(next() * (current.length + 2));
          await ctx.lists.update(ANA, sprint, target.id, { name: target.name, position });
          expected = expected.filter((id) => id !== target.id);
          expected.splice(Math.min(position, current.length) - 1, 0, target.id);
        } else {
          const target = pick(current);
          if (!target) continue;
          await ctx.lists.delete(ANA, sprint, target.id);
          expected = expected.filter((id) => id !== target.id);
        }

        const after = (await ctx.boards.get(ANA, sprint)).lists;
        expectContiguous(after.map((l) => l.position));
        expect(after.map((l) => l.id)).toEqual(expected);
      }
    });
  });
});
