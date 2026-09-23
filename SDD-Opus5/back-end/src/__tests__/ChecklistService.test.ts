import { beforeEach, describe, expect, it } from "vitest";
import { AppError } from "../errors/AppError";
import type { ChecklistTransaction } from "../repositories/ChecklistRepository";
import { BoardService } from "../services/BoardService";
import { CardService } from "../services/CardService";
import { ChecklistService } from "../services/ChecklistService";
import { ListService } from "../services/ListService";
import { InMemoryBoardCardRepository } from "./helpers/InMemoryBoardCardRepository";
import { InMemoryBoardListRepository } from "./helpers/InMemoryBoardListRepository";
import { InMemoryBoardLock } from "./helpers/InMemoryBoardLock";
import { InMemoryBoardRepository } from "./helpers/InMemoryBoardRepository";
import { InMemoryChecklistRepository } from "./helpers/InMemoryChecklistRepository";

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

describe("ChecklistService (RF06)", () => {
  let store: InMemoryBoardRepository;
  let repo: InMemoryChecklistRepository;
  let checklist: ChecklistService;
  let cards: CardService;
  let lists: ListService;
  let boards: BoardService;
  let sprint: string;
  let emProgresso: string;
  let concluido: string;
  let card: string;
  const I: Record<string, string> = {};

  const view = async (cardId = card) =>
    (await cards.get(ANA, sprint, cardId)).checklist.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.text}`);

  const face = async (cardId = card) => {
    for (const list of (await boards.get(ANA, sprint)).lists) {
      const found = list.cards.find((c) => c.id === cardId);
      if (found) return { list: list.name, total: found.checklistTotal, done: found.checklistDone };
    }
    return undefined;
  };

  beforeEach(async () => {
    store = new InMemoryBoardRepository();
    const lock = new InMemoryBoardLock(store);
    repo = new InMemoryChecklistRepository(store);
    checklist = new ChecklistService(repo);
    cards = new CardService(new InMemoryBoardCardRepository(store, lock));
    lists = new ListService(new InMemoryBoardListRepository(store, lock));
    boards = new BoardService(store);

    const board = await boards.create(ANA, { name: "Sprint", color: "navy", withDefaultLists: true });
    sprint = board.id;
    emProgresso = board.lists[1]?.id ?? "";
    concluido = board.lists[2]?.id ?? "";
    card = store.addCard(emProgresso, "Refatorar filtros");
    I.hook = store.addChecklistItem(card, "Extrair hook", true);
    I.url = store.addChecklistItem(card, "Persistir filtro na URL", true);
    I.testes = store.addChecklistItem(card, "Cobrir com testes");
    I.a11y = store.addChecklistItem(card, "Revisar acessibilidade");
  });

  describe("display", () => {
    it("returns the checklist in order with the card (CA01)", async () => {
      expect(await view()).toEqual([
        "[x] Extrair hook",
        "[x] Persistir filtro na URL",
        "[ ] Cobrir com testes",
        "[ ] Revisar acessibilidade",
      ]);
    });

    it("aggregates counts on the card face (CA03)", async () => {
      expect(await face()).toMatchObject({ total: 4, done: 2 });
    });

    it("reports zero counts for a card without items (CA02, CA04)", async () => {
      const novo = store.addCard(emProgresso, "Novo");
      expect(await view(novo)).toEqual([]);
      expect(await face(novo)).toMatchObject({ total: 0, done: 0 });
    });
  });

  describe("add", () => {
    it("adds at the end, not done, and returns the whole checklist (CA08, RN06, RN07, C128)", async () => {
      const result = await checklist.add(ANA, sprint, card, { text: "Atualizar docs" });
      expect(result.item).toMatchObject({ text: "Atualizar docs", done: false });
      expect(result.checklist.map((i) => i.text)).toEqual([
        "Extrair hook",
        "Persistir filtro na URL",
        "Cobrir com testes",
        "Revisar acessibilidade",
        "Atualizar docs",
      ]);
      expect(await face()).toMatchObject({ total: 5, done: 2 });
    });

    it("keeps the order of consecutive additions (CA09)", async () => {
      await checklist.add(ANA, sprint, card, { text: "A" });
      await checklist.add(ANA, sprint, card, { text: "B" });
      expect((await view()).slice(-2)).toEqual(["[ ] A", "[ ] B"]);
    });

    it("adds the first item of a card (CA10)", async () => {
      const novo = store.addCard(emProgresso, "Novo");
      const result = await checklist.add(ANA, sprint, novo, { text: "Começar" });
      expect(result.checklist).toEqual([expect.objectContaining({ text: "Começar", done: false, position: 1 })]);
    });

    it("allows repeated texts (CA16, RN05)", async () => {
      await checklist.add(ANA, sprint, card, { text: "Extrair hook" });
      expect((await view()).filter((line) => line.endsWith("Extrair hook"))).toHaveLength(2);
    });

    it("appends after the highest position even with gaps from deletions (F69)", async () => {
      await checklist.remove(ANA, sprint, card, I.a11y ?? "");
      const { item } = await checklist.add(ANA, sprint, card, { text: "Depois" });
      expect(item.position).toBe(4);
      await checklist.remove(ANA, sprint, card, I.testes ?? "");
      expect((await checklist.add(ANA, sprint, card, { text: "Mais" })).item.position).toBe(5);
    });

    it("refuses the 101st item (RN16, CB10)", async () => {
      for (let i = 4; i < 100; i += 1) store.addChecklistItem(card, `X${i}`);
      expect(await code(checklist.add(ANA, sprint, card, { text: "Excesso" }))).toBe("CHECKLIST_LIMIT_REACHED");
      expect((await view())).toHaveLength(100);
    });

    it("never exceeds the limit with concurrent additions (N122)", async () => {
      for (let i = 4; i < 98; i += 1) store.addChecklistItem(card, `X${i}`);
      const results = await Promise.allSettled(
        Array.from({ length: 6 }, (_, i) => checklist.add(ANA, sprint, card, { text: `C${i}` })),
      );
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
      expect(await view()).toHaveLength(100);
    });

    it("serializes concurrent additions without duplicate positions (CB13, N123)", async () => {
      await Promise.all(Array.from({ length: 10 }, (_, i) => checklist.add(ANA, sprint, card, { text: `P${i}` })));
      const positions = (await cards.get(ANA, sprint, card)).checklist.map((i) => i.position);
      expect(new Set(positions).size).toBe(positions.length);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    });
  });

  describe("mark and edit", () => {
    it("marks and unmarks with the desired state (CA17, CA18)", async () => {
      await checklist.update(ANA, sprint, card, I.testes ?? "", { text: undefined, done: true });
      expect(await face()).toMatchObject({ total: 4, done: 3 });
      await checklist.update(ANA, sprint, card, I.hook ?? "", { text: undefined, done: false });
      expect(await face()).toMatchObject({ total: 4, done: 2 });
    });

    it("completes the checklist (CA19)", async () => {
      await checklist.update(ANA, sprint, card, I.testes ?? "", { text: undefined, done: true });
      await checklist.update(ANA, sprint, card, I.a11y ?? "", { text: undefined, done: true });
      expect(await face()).toMatchObject({ total: 4, done: 4 });
    });

    it("is idempotent for the same desired state (CA21, CA37, RN08)", async () => {
      await checklist.update(ANA, sprint, card, I.testes ?? "", { text: undefined, done: true });
      await checklist.update(ANA, sprint, card, I.testes ?? "", { text: undefined, done: true });
      expect(await face()).toMatchObject({ done: 3 });
    });

    it("edits the text without changing state or position (CA22, CA23)", async () => {
      const result = await checklist.update(ANA, sprint, card, I.hook ?? "", { text: "Extrair hook useLabelFilter", done: undefined });
      expect(result.item).toMatchObject({ text: "Extrair hook useLabelFilter", done: true, position: 1 });
    });

    it("applies a text edit and a mark sent separately without overwriting each other (CB15, N125)", async () => {
      await Promise.all([
        checklist.update(ANA, sprint, card, I.testes ?? "", { text: "Cobrir com testes de unidade", done: undefined }),
        checklist.update(ANA, sprint, card, I.testes ?? "", { text: undefined, done: true }),
      ]);
      expect((await view())[2]).toBe("[x] Cobrir com testes de unidade");
    });
  });

  describe("remove", () => {
    it("removes an item and keeps the others in order (CA27, RN06)", async () => {
      const result = await checklist.remove(ANA, sprint, card, I.url ?? "");
      expect(result.checklist.map((i) => i.text)).toEqual(["Extrair hook", "Cobrir com testes", "Revisar acessibilidade"]);
      expect(await face()).toMatchObject({ total: 3, done: 1 });
    });

    it("removes the last item (CA28)", async () => {
      const unico = store.addCard(emProgresso, "Único item");
      const fazer = store.addChecklistItem(unico, "Fazer");
      expect((await checklist.remove(ANA, sprint, unico, fazer)).checklist).toEqual([]);
      expect(await face(unico)).toMatchObject({ total: 0, done: 0 });
    });

    it("answers a second removal with CHECKLIST_ITEM_NOT_FOUND; the client treats it as success (CA36, RN14)", async () => {
      await checklist.remove(ANA, sprint, card, I.a11y ?? "");
      expect(await code(checklist.remove(ANA, sprint, card, I.a11y ?? ""))).toBe("CHECKLIST_ITEM_NOT_FOUND");
      expect(await code(checklist.update(ANA, sprint, card, I.a11y ?? "", { text: undefined, done: true }))).toBe(
        "CHECKLIST_ITEM_NOT_FOUND",
      );
    });
  });

  describe("card lifecycle", () => {
    it("keeps the checklist when the card is saved or moved (CA30, CA31)", async () => {
      await cards.update(ANA, sprint, card, { title: "Refatorar filtros", description: "Nova", listId: concluido, position: undefined, dueDate: null });
      expect(await face()).toMatchObject({ list: "Concluído", total: 4, done: 2 });
      expect(await view()).toHaveLength(4);
    });

    it("keeps the checklist when the list is deleted moving its cards (CA32)", async () => {
      await lists.delete(ANA, sprint, emProgresso, { strategy: "move", targetListId: concluido, expectedCardCount: 1 });
      expect(await face()).toMatchObject({ list: "Concluído", total: 4, done: 2 });
    });

    it("deletes the items with the card and reports CARD_NOT_FOUND afterwards (CA33, RN15)", async () => {
      await cards.delete(ANA, sprint, card);
      expect(store.checklistItems.size).toBe(0);
      expect(await code(checklist.add(ANA, sprint, card, { text: "X" }))).toBe("CARD_NOT_FOUND");
      expect(await code(checklist.update(ANA, sprint, card, I.hook ?? "", { text: undefined, done: false }))).toBe("CARD_NOT_FOUND");
    });

    it("deletes the items when the list is deleted in cascade (CA33)", async () => {
      await lists.delete(ANA, sprint, emProgresso, { strategy: "cascade", targetListId: undefined, expectedCardCount: 1 });
      expect(store.checklistItems.size).toBe(0);
    });

    it("does not count items in list or board card counts (RN17)", async () => {
      const board = await boards.get(ANA, sprint);
      expect(board.cardCount).toBe(1);
      expect(board.lists[1]?.cardCount).toBe(1);
    });
  });

  describe("protection and order of checks", () => {
    it("answers another account's board with BOARD_NOT_FOUND (CA34)", async () => {
      const beta = await boards.create(BRUNO, { name: "Beta", color: "navy", withDefaultLists: true });
      const k = store.addCard(beta.lists[0]?.id ?? "", "K");
      const x = store.addChecklistItem(k, "X");
      expect(await code(checklist.add(ANA, beta.id, k, { text: "Hack" }))).toBe("BOARD_NOT_FOUND");
      expect(await code(checklist.update(ANA, beta.id, k, x, { text: undefined, done: true }))).toBe("BOARD_NOT_FOUND");
      expect(await code(checklist.remove(ANA, beta.id, "not-a-uuid", "nope"))).toBe("BOARD_NOT_FOUND");
      expect(store.itemsOf(k)).toEqual([expect.objectContaining({ text: "X", done: false })]);
    });

    it("refuses an item of another card, in the same or another board (CA35)", async () => {
      const outro = store.addCard(emProgresso, "Outro");
      const x = store.addChecklistItem(outro, "X");
      expect(await code(checklist.update(ANA, sprint, card, x, { text: undefined, done: true }))).toBe("CHECKLIST_ITEM_NOT_FOUND");
      expect(await code(checklist.remove(ANA, sprint, card, x))).toBe("CHECKLIST_ITEM_NOT_FOUND");
      expect(store.itemsOf(outro)).toEqual([expect.objectContaining({ text: "X", done: false })]);
    });

    it("refuses a card of another board with CARD_NOT_FOUND", async () => {
      const outroQuadro = await boards.create(ANA, { name: "Outro", color: "navy", withDefaultLists: true });
      const other = store.addCard(outroQuadro.lists[0]?.id ?? "", "Other");
      expect(await code(checklist.add(ANA, sprint, other, { text: "X" }))).toBe("CARD_NOT_FOUND");
    });

    it("checks board, card, item and limit in this order (C121)", async () => {
      expect(await code(checklist.update(ANA, sprint, "abc", "def", { text: undefined, done: true }))).toBe("CARD_NOT_FOUND");
      expect(await code(checklist.update(ANA, sprint, card, "def", { text: undefined, done: true }))).toBe("CHECKLIST_ITEM_NOT_FOUND");
      expect(await code(checklist.remove(ANA, sprint, card, MISSING))).toBe("CHECKLIST_ITEM_NOT_FOUND");
    });
  });

  describe("atomicity and cost", () => {
    it.each(["insert", "update", "remove"] as const)("rolls back when %s fails (RN12)", async (primitive: keyof ChecklistTransaction) => {
      const before = await view();
      repo.failOn = primitive;
      const attempt =
        primitive === "insert"
          ? checklist.add(ANA, sprint, card, { text: "X" })
          : primitive === "update"
            ? checklist.update(ANA, sprint, card, I.testes ?? "", { text: "Y", done: true })
            : checklist.remove(ANA, sprint, card, I.testes ?? "");
      await expect(attempt).rejects.toThrow();
      repo.failOn = null;
      expect(await view()).toEqual(before);
    });

    it("uses a constant number of primitives whatever the checklist size (N111)", async () => {
      await checklist.add(ANA, sprint, card, { text: "A" });
      for (let i = 0; i < 80; i += 1) store.addChecklistItem(card, `X${i}`);
      await checklist.add(ANA, sprint, card, { text: "B" });
      const [small, large] = repo.calls.slice(-2);
      expect(small?.length).toBe(large?.length);
    });
  });
});
