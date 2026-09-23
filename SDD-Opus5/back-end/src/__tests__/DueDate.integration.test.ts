import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CreateUsersTable1760000000000 } from "../migrations/1760000000000-CreateUsersTable";
import { CreateBoardsListsCards1760000001000 } from "../migrations/1760000001000-CreateBoardsListsCards";
import { ListPositionsAndNameLimit1760000002000 } from "../migrations/1760000002000-ListPositionsAndNameLimit";
import { CardsContentAndPositions1760000003000 } from "../migrations/1760000003000-CardsContentAndPositions";
import { BoardListDeletionLock1760000004000 } from "../migrations/1760000004000-BoardListDeletionLock";
import { CreateChecklistItems1760000005000 } from "../migrations/1760000005000-CreateChecklistItems";
import { BoardMembersInvitationsAssignees1760000006000 } from "../migrations/1760000006000-BoardMembersInvitationsAssignees";
import { CreateLabels1760000007000 } from "../migrations/1760000007000-CreateLabels";
import { CreateCardComments1760000008000 } from "../migrations/1760000008000-CreateCardComments";
import { CardDueDate1760000009000 } from "../migrations/1760000009000-CardDueDate";
import { TypeOrmBoardCardRepository } from "../repositories/BoardCardRepository";
import { TypeOrmBoardRepository } from "../repositories/BoardRepository";
import { BoardService } from "../services/BoardService";
import { CardService } from "../services/CardService";

/**
 * Integration tests against a real PostgreSQL (RF10 N217). Skipped without TEST_DATABASE_URL; drops every table.
 * Run with a TZ west of UTC (e.g. TZ=America/Sao_Paulo) to prove dates never shift by one day (D49).
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("Due dates (PostgreSQL)", () => {
  let dataSource: DataSource;
  let boards: BoardService;
  let cards: CardService;
  let caio: string;
  let boardId: string;
  let listA: string;
  let listB: string;

  const newCard = async (listId: string, title: string) => (await cards.create(caio, boardId, listId, { title })).card.id;
  const save = (cardId: string, dueDate: string | null, listId?: string) =>
    cards.update(caio, boardId, cardId, { title: "Card", description: null, listId, position: undefined, dueDate });

  beforeAll(async () => {
    dataSource = new DataSource({
      type: "postgres",
      url: url ?? "",
      migrations: [
        CreateUsersTable1760000000000,
        CreateBoardsListsCards1760000001000,
        ListPositionsAndNameLimit1760000002000,
        CardsContentAndPositions1760000003000,
        BoardListDeletionLock1760000004000,
        CreateChecklistItems1760000005000,
        BoardMembersInvitationsAssignees1760000006000,
        CreateLabels1760000007000,
        CreateCardComments1760000008000,
        CardDueDate1760000009000,
      ],
      synchronize: false,
    });
    await dataSource.initialize();
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
    boards = new BoardService(new TypeOrmBoardRepository(dataSource));
    cards = new CardService(new TypeOrmBoardCardRepository(dataSource));
  });

  afterAll(async () => {
    await dataSource?.destroy();
  });

  beforeEach(async () => {
    for (const table of ["boards", "users"]) await dataSource.query(`DELETE FROM ${table}`);
    caio = randomUUID();
    await dataSource.query(`INSERT INTO users (id, name, email, password_hash) VALUES ($1, 'Caio', $2, 'x')`, [caio, `${caio}@t.dev`]);
    const board = await boards.create(caio, { name: "Sprint", color: "navy", withDefaultLists: true });
    boardId = board.id;
    listA = board.lists[0]?.id ?? "";
    listB = board.lists[2]?.id ?? "";
  });

  it("enforces the 2000–2099 range at the database level (N209)", async () => {
    const cardId = await newCard(listA, "C");
    await expect(dataSource.query(`UPDATE cards SET due_date = DATE '1999-12-31' WHERE id = $1`, [cardId])).rejects.toThrow();
    await expect(dataSource.query(`UPDATE cards SET due_date = DATE '2100-01-01' WHERE id = $1`, [cardId])).rejects.toThrow();
    await expect(dataSource.query(`UPDATE cards SET due_date = DATE '2099-12-31' WHERE id = $1`, [cardId])).resolves.toBeDefined();
  });

  it("round-trips YYYY-MM-DD without shifting the day, whatever the process time zone (D49, N210)", async () => {
    const cardId = await newCard(listA, "C");
    const { card, lists } = await save(cardId, "2026-01-01");
    expect(card.dueDate).toBe("2026-01-01");
    expect(lists[0]?.cards[0]?.dueDate).toBe("2026-01-01");
    expect((await cards.get(caio, boardId, cardId)).dueDate).toBe("2026-01-01");
    expect((await boards.get(caio, boardId)).lists[0]?.cards[0]?.dueDate).toBe("2026-01-01");
  });

  it("keeps the due date when the card moves and removes it with null (RN08, CA11)", async () => {
    const cardId = await newCard(listA, "C");
    await save(cardId, "2026-08-27");
    const moved = await save(cardId, "2026-08-27", listB);
    expect(moved.card).toMatchObject({ listId: listB, dueDate: "2026-08-27" });
    expect((await save(cardId, null)).card.dueDate).toBeNull();
  });

  it("counts overdue cards with the informed today, or the database date (F139, CA25, CA27)", async () => {
    await save(await newCard(listA, "A"), "2026-08-27");
    await save(await newCard(listB, "B"), "2026-08-28");
    await save(await newCard(listA, "C"), "2026-08-29");
    await newCard(listA, "D");

    const [withToday] = await boards.list(caio, "2026-08-29");
    expect(withToday?.overdueCount).toBe(2);
    const [earlier] = await boards.list(caio, "2026-08-27");
    expect(earlier?.overdueCount).toBe(0);
    const [fallback] = await boards.list(caio);
    expect(typeof fallback?.overdueCount).toBe("number");
  });

  it("migration is reversible (D48)", async () => {
    await dataSource.undoLastMigration();
    const before = (await dataSource.query(
      `SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'due_date'`,
    )) as Array<{ n: number }>;
    expect(before[0]?.n).toBe(0);
    await dataSource.runMigrations();
    const after = (await dataSource.query(
      `SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'due_date'`,
    )) as Array<{ n: number }>;
    expect(after[0]?.n).toBe(1);
  });
});
