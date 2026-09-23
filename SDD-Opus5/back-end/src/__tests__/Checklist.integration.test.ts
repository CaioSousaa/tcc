import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Board } from "../entities/Board";
import { BoardList } from "../entities/BoardList";
import { Card } from "../entities/Card";
import { ChecklistItem } from "../entities/ChecklistItem";
import { User } from "../entities/User";
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
import { TypeOrmBoardListRepository } from "../repositories/BoardListRepository";
import { TypeOrmChecklistRepository } from "../repositories/ChecklistRepository";
import { loadListsWithCards } from "../repositories/listsWithCards";
import { CardService } from "../services/CardService";
import { ChecklistService } from "../services/ChecklistService";
import { ListService } from "../services/ListService";

/** Integration tests against a real PostgreSQL (RF06 N134). Skipped without TEST_DATABASE_URL; drops every table. */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("Checklist (PostgreSQL)", () => {
  let dataSource: DataSource;
  let checklist: ChecklistService;
  let cards: CardService;
  let lists: ListService;
  let ownerId: string;
  let boardId: string;
  let listA: string;
  let listB: string;
  let cardId: string;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: "postgres",
      url: url ?? "",
      entities: [User, Board, BoardList, Card, ChecklistItem],
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
    checklist = new ChecklistService(new TypeOrmChecklistRepository(dataSource));
    cards = new CardService(new TypeOrmBoardCardRepository(dataSource));
    lists = new ListService(new TypeOrmBoardListRepository(dataSource));
  });

  afterAll(async () => {
    await dataSource?.destroy();
  });

  beforeEach(async () => {
    for (const table of ["checklist_items", "cards", "lists", "boards", "users"]) await dataSource.query(`DELETE FROM ${table}`);
    ownerId = randomUUID();
    boardId = randomUUID();
    listA = randomUUID();
    listB = randomUUID();
    cardId = randomUUID();
    await dataSource.query(`INSERT INTO users (id, name, email, password_hash) VALUES ($1, 'Ana', $2, 'x')`, [ownerId, `${ownerId}@t.dev`]);
    await dataSource.query(`INSERT INTO boards (id, owner_id, name, color) VALUES ($1, $2, 'Sprint', 'navy')`, [boardId, ownerId]);
    await dataSource.query(`INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'admin')`, [boardId, ownerId]);
    await dataSource.query(`INSERT INTO lists (id, board_id, name, position) VALUES ($1, $2, 'A', 1), ($3, $2, 'B', 2)`, [listA, boardId, listB]);
    await dataSource.query(`INSERT INTO cards (id, list_id, title, position) VALUES ($1, $2, 'Refatorar', 1)`, [cardId, listA]);
  });

  it("aggregates checklist counts in the single cards statement (N112)", async () => {
    await checklist.add(ownerId, boardId, cardId, { text: "1" });
    const { item } = await checklist.add(ownerId, boardId, cardId, { text: "2" });
    await checklist.update(ownerId, boardId, cardId, item.id, { text: undefined, done: true });
    const [list] = await loadListsWithCards(dataSource.manager, boardId, [listA]);
    expect(list?.cards[0]).toMatchObject({ checklistTotal: 2, checklistDone: 1 });
  });

  it("never exceeds 100 items with concurrent additions (N122)", async () => {
    for (let i = 1; i <= 98; i += 1) {
      await dataSource.query(`INSERT INTO checklist_items (id, card_id, text, position) VALUES ($1, $2, 'x', $3)`, [randomUUID(), cardId, i]);
    }
    await Promise.allSettled(Array.from({ length: 6 }, (_, i) => checklist.add(ownerId, boardId, cardId, { text: `c${i}` })));
    const rows = (await dataSource.query(`SELECT count(*)::int AS n FROM checklist_items WHERE card_id = $1`, [cardId])) as Array<{ n: number }>;
    expect(rows[0]?.n).toBe(100);
  });

  it("updates only the fields sent (CB15)", async () => {
    const { item } = await checklist.add(ownerId, boardId, cardId, { text: "Original" });
    await checklist.update(ownerId, boardId, cardId, item.id, { text: "Editado", done: undefined });
    await checklist.update(ownerId, boardId, cardId, item.id, { text: undefined, done: true });
    expect((await cards.get(ownerId, boardId, cardId)).checklist).toEqual([expect.objectContaining({ text: "Editado", done: true })]);
  });

  it("keeps items when the card moves and when its list is deleted moving cards (CA31, CA32)", async () => {
    await checklist.add(ownerId, boardId, cardId, { text: "Fica" });
    await cards.update(ownerId, boardId, cardId, { title: "Refatorar", description: null, listId: listB, position: undefined, dueDate: null });
    await lists.delete(ownerId, boardId, listB, { strategy: "move", targetListId: listA, expectedCardCount: 1 });
    expect((await cards.get(ownerId, boardId, cardId)).checklist.map((i) => i.text)).toEqual(["Fica"]);
  });

  it("removes items through ON DELETE CASCADE (RN15)", async () => {
    await checklist.add(ownerId, boardId, cardId, { text: "Some" });
    await cards.delete(ownerId, boardId, cardId);
    const rows = (await dataSource.query(`SELECT count(*)::int AS n FROM checklist_items`)) as Array<{ n: number }>;
    expect(rows[0]?.n).toBe(0);
  });

  it("migration is reversible (C118)", async () => {
    await dataSource.undoLastMigration(); // RF10
    await dataSource.undoLastMigration(); // RF09
    await dataSource.undoLastMigration(); // RF08
    await dataSource.undoLastMigration(); // RF07
    await dataSource.undoLastMigration(); // RF06
    await dataSource.runMigrations();
    const rows = (await dataSource.query(`SELECT to_regclass('checklist_items') AS t`)) as Array<{ t: string | null }>;
    expect(rows[0]?.t).toBe("checklist_items");
  });
});
