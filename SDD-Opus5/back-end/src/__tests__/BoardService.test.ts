import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LIST_NAMES } from "../domain/boards";
import { AppError } from "../errors/AppError";
import { BoardService } from "../services/BoardService";
import { InMemoryBoardRepository } from "./helpers/InMemoryBoardRepository";

const ANA = "11111111-1111-4111-8111-111111111111";
const BRUNO = "22222222-2222-4222-8222-222222222222";
const MISSING = "33333333-3333-4333-8333-333333333333";

async function expectNotFound(promise: Promise<unknown>) {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(AppError);
  expect((error as AppError).code).toBe("BOARD_NOT_FOUND");
  expect((error as AppError).message).toBe("Quadro não encontrado.");
}

describe("BoardService", () => {
  let repository: InMemoryBoardRepository;
  let service: BoardService;

  beforeEach(() => {
    repository = new InMemoryBoardRepository();
    service = new BoardService(repository);
  });

  describe("create", () => {
    it("creates the board with the three default lists, empty and in order (CA09, RN07, RF03 C49)", async () => {
      const board = await service.create(ANA, { name: "Sprint 13", color: "purple", withDefaultLists: true });

      expect(board).toMatchObject({ name: "Sprint 13", color: "purple", listCount: 3, cardCount: 0 });
      expect(board.lists.map((l) => l.name)).toEqual(["A fazer", "Em progresso", "Concluído"]);
      expect(board.lists.map((l) => l.position)).toEqual([1, 2, 3]);
      expect(board.lists.map((l) => l.cardCount)).toEqual([0, 0, 0]);
      expect(DEFAULT_LIST_NAMES).toEqual(["A fazer", "Em progresso", "Concluído"]);
    });

    it("creates a board without lists when the option is off (CA10)", async () => {
      const board = await service.create(ANA, { name: "Sprint 13", color: "navy", withDefaultLists: false });
      expect(board.lists).toEqual([]);
      expect(board.listCount).toBe(0);
    });

    it("assigns the board to the caller (RN01, CA06)", async () => {
      const board = await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: false });
      expect(repository.boards.get(board.id)?.ownerId).toBe(ANA);
    });

    it("does not expose the owner (plan A22)", async () => {
      const board = await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: true });
      expect(board).not.toHaveProperty("ownerId");
      expect(Object.keys(board).sort()).toEqual(
        [
          "cardCount",
          "color",
          "createdAt",
          "id",
          "labels",
          "listCount",
          "lists",
          "lockListDeletion",
          "memberCount",
          "memberPreview",
          "members",
          "myRole",
          "name",
          "overdueCount",
          "updatedAt",
        ],
      );
    });

    it("allows repeated names as distinct boards (CA15, RN05)", async () => {
      const first = await service.create(ANA, { name: "Sprint 13", color: "navy", withDefaultLists: false });
      const second = await service.create(ANA, { name: "Sprint 13", color: "navy", withDefaultLists: false });
      expect(first.id).not.toBe(second.id);
      expect(await service.list(ANA)).toHaveLength(2);
    });

    it("persists nothing when the default lists cannot be created (CE04, RN07)", async () => {
      repository.failOnListInsert = true;
      await expect(
        service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: true }),
      ).rejects.toThrow();
      expect(repository.boards.size).toBe(0);
      expect(repository.lists.size).toBe(0);
    });

    it("sends board and lists in a single repository operation (F12)", async () => {
      const createWithLists = vi.spyOn(repository, "createWithLists");
      await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: true });
      expect(createWithLists).toHaveBeenCalledTimes(1);
      expect(createWithLists.mock.calls[0]?.[1].lists).toHaveLength(3);
    });
  });

  describe("list", () => {
    it("returns only the caller's boards (CA01, CA06, RN02)", async () => {
      await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: false });
      await service.create(ANA, { name: "Beta", color: "navy", withDefaultLists: false });
      await service.create(BRUNO, { name: "Gama", color: "navy", withDefaultLists: false });

      const names = (await service.list(ANA)).map((b) => b.name);
      expect(names.sort()).toEqual(["Alfa", "Beta"]);
    });

    it("orders from newest to oldest (CA02, CA11, RN09)", async () => {
      await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: false });
      await service.create(ANA, { name: "Beta", color: "navy", withDefaultLists: false });
      expect((await service.list(ANA)).map((b) => b.name)).toEqual(["Beta", "Alfa"]);
    });

    it("keeps the order after editing (CA03, RN09)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: false });
      await service.create(ANA, { name: "Beta", color: "navy", withDefaultLists: false });
      await service.update(ANA, alfa.id, { name: "Alfa 2", color: "navy" });
      expect((await service.list(ANA)).map((b) => b.name)).toEqual(["Beta", "Alfa 2"]);
    });

    it("returns an empty list for a user without boards (CA05)", async () => {
      await expect(service.list(ANA)).resolves.toEqual([]);
    });

    it("reports list and card counts summed across lists (CA04, RN10)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "green", withDefaultLists: true });
      const [first] = alfa.lists;
      repository.addCard(first?.id ?? "");

      const [summary] = await service.list(ANA);
      expect(summary).toMatchObject({ name: "Alfa", color: "green", listCount: 3, cardCount: 1 });
    });
  });

  describe("get", () => {
    it("returns the board with its lists in creation order (CA18, CA20)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: false });
      repository.addList(alfa.id, "X");
      repository.addList(alfa.id, "Y");

      const board = await service.get(ANA, alfa.id);
      expect(board.name).toBe("Alfa");
      expect(board.lists.map((l) => l.name)).toEqual(["X", "Y"]);
    });

    it("answers a board of another account exactly like a missing one (CA21, CA22, RN03)", async () => {
      const beta = await service.create(BRUNO, { name: "Beta", color: "navy", withDefaultLists: false });
      await expectNotFound(service.get(ANA, beta.id));
      await expectNotFound(service.get(ANA, MISSING));
    });
  });

  describe("update", () => {
    it("changes name and color and returns current counts (CA24, CA26)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "green", withDefaultLists: true });
      const [first] = alfa.lists;
      for (let i = 0; i < 5; i += 1) repository.addCard(first?.id ?? "");

      const updated = await service.update(ANA, alfa.id, { name: "Ômega", color: "amber" });

      expect(updated).toMatchObject({ id: alfa.id, name: "Ômega", color: "amber", listCount: 3, cardCount: 5 });
      expect((await service.get(ANA, alfa.id)).lists).toEqual(alfa.lists);
    });

    it("keeps the creation date (RN08)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "green", withDefaultLists: false });
      const updated = await service.update(ANA, alfa.id, { name: "Ômega", color: "amber" });
      expect(updated.createdAt).toBe(alfa.createdAt);
    });

    it("accepts saving unchanged values (CA29)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "green", withDefaultLists: false });
      await expect(service.update(ANA, alfa.id, { name: "Alfa", color: "green" })).resolves.toMatchObject({
        name: "Alfa",
        color: "green",
      });
    });

    it("lets the last save win (CB12)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "green", withDefaultLists: false });
      await service.update(ANA, alfa.id, { name: "Aba 1", color: "blue" });
      await service.update(ANA, alfa.id, { name: "Aba 2", color: "purple" });
      expect(await service.get(ANA, alfa.id)).toMatchObject({ name: "Aba 2", color: "purple" });
    });

    it("refuses to touch a board of another account and leaves it unchanged (CA35)", async () => {
      const beta = await service.create(BRUNO, { name: "Beta", color: "navy", withDefaultLists: false });
      await expectNotFound(service.update(ANA, beta.id, { name: "Hack", color: "amber" }));
      expect(await service.get(BRUNO, beta.id)).toMatchObject({ name: "Beta", color: "navy" });
    });

    it("reports a board deleted elsewhere as not found (CB11, CB14)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: false });
      await service.delete(ANA, alfa.id);
      await expectNotFound(service.update(ANA, alfa.id, { name: "Ômega", color: "navy" }));
    });
  });

  describe("delete", () => {
    it("removes the board, its lists and its cards (CA31, CA32, RN11)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: true });
      for (const list of alfa.lists) repository.addCard(list.id);

      await service.delete(ANA, alfa.id);

      expect(repository.boards.has(alfa.id)).toBe(false);
      expect([...repository.lists.values()].some((l) => l.boardId === alfa.id)).toBe(false);
      expect(repository.cards.size).toBe(0);
      await expectNotFound(service.get(ANA, alfa.id));
    });

    it("does not change other boards or their counts (CA32)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: true });
      const beta = await service.create(ANA, { name: "Beta", color: "navy", withDefaultLists: true });
      repository.addCard(beta.lists[0]?.id ?? "");

      await service.delete(ANA, alfa.id);

      expect(await service.list(ANA)).toEqual([
        expect.objectContaining({ id: beta.id, listCount: 3, cardCount: 1 }),
      ]);
    });

    it("refuses to delete a board of another account and keeps it intact (CA35)", async () => {
      const beta = await service.create(BRUNO, { name: "Beta", color: "navy", withDefaultLists: true });
      await expectNotFound(service.delete(ANA, beta.id));
      expect(await service.get(BRUNO, beta.id)).toMatchObject({ listCount: 3 });
    });

    it("reports a second deletion as not found; the client treats it as success (RN14, plan A26)", async () => {
      const alfa = await service.create(ANA, { name: "Alfa", color: "navy", withDefaultLists: false });
      await service.delete(ANA, alfa.id);
      await expectNotFound(service.delete(ANA, alfa.id));
    });
  });
});
