import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Board } from "../entities/Board";
import { BoardList } from "../entities/BoardList";
import { Card } from "../entities/Card";
import { ChecklistItem } from "../entities/ChecklistItem";
import { User } from "../entities/User";
import { AppError } from "../errors/AppError";
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
import { CardService } from "../services/CardService";
import { ListService } from "../services/ListService";

/**
 * Integration tests against a real PostgreSQL (RF04 N89). Skipped unless
 * TEST_DATABASE_URL points to a disposable database: every table is dropped.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("TypeOrmBoardCardRepository (PostgreSQL)", () => {
  let dataSource: DataSource;
  let cards: CardService;
  let lists: ListService;
  let ownerId: string;
  let boardId: string;
  let listA: string;
  let listB: string;

  const titles = async (listId: string) =>
    (
      (await dataSource.query(`SELECT title, position FROM cards WHERE list_id = $1 ORDER BY position`, [listId])) as Array<{
        title: string;
        position: number;
      }>
    ).map((row) => [row.title, Number(row.position)]);

  const insertCard = (listId: string, title: string, position: number) =>
    dataSource.query(`INSERT INTO cards (id, list_id, title, position) VALUES ($1, $2, $3, $4) RETURNING id`, [
      randomUUID(),
      listId,
      title,
      position,
    ]) as Promise<Array<{ id: string }>>;

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
    cards = new CardService(new TypeOrmBoardCardRepository(dataSource));
    lists = new ListService(new TypeOrmBoardListRepository(dataSource));
  });

  afterAll(async () => {
    await dataSource?.destroy();
  });

  beforeEach(async () => {
    await dataSource.query(`DELETE FROM cards`);
    await dataSource.query(`DELETE FROM lists`);
    await dataSource.query(`DELETE FROM boards`);
    await dataSource.query(`DELETE FROM users`);

    ownerId = randomUUID();
    boardId = randomUUID();
    listA = randomUUID();
    listB = randomUUID();
    await dataSource.query(`INSERT INTO users (id, name, email, password_hash) VALUES ($1, 'Ana', $2, 'x')`, [
      ownerId,
      `${ownerId}@test.dev`,
    ]);
    await dataSource.query(`INSERT INTO boards (id, owner_id, name, color) VALUES ($1, $2, 'Sprint', 'navy')`, [boardId, ownerId]);
    await dataSource.query(`INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'admin')`, [boardId, ownerId]);
    await dataSource.query(`INSERT INTO lists (id, board_id, name, position) VALUES ($1, $2, 'A fazer', 1), ($3, $2, 'Em progresso', 2)`, [
      listA,
      boardId,
      listB,
    ]);
    for (const [index, title] of ["C1", "C2", "C3"].entries()) await insertCard(listA, title, index + 1);
    await insertCard(listB, "P1", 1);
  });

  const idOf = async (title: string) =>
    ((await dataSource.query(`SELECT id FROM cards WHERE title = $1`, [title])) as Array<{ id: string }>)[0]?.id ?? "";

  it("moves between lists without violating UQ_cards_list_position (F40, D22)", async () => {
    await cards.update(ownerId, boardId, await idOf("C1"), { title: "C1", description: null, listId: listB, position: 1, dueDate: null });
    expect(await titles(listA)).toEqual([
      ["C2", 1],
      ["C3", 2],
    ]);
    expect(await titles(listB)).toEqual([
      ["C1", 1],
      ["P1", 2],
    ]);
  });

  it("reorders within a list with a single statement (CA30, CA31)", async () => {
    await cards.update(ownerId, boardId, await idOf("C1"), { title: "C1", description: null, listId: listA, position: 3, dueDate: null });
    expect((await titles(listA)).map(([title]) => title)).toEqual(["C2", "C3", "C1"]);
  });

  it("serializes concurrent creations (CB13, RN06)", async () => {
    await Promise.all(Array.from({ length: 12 }, (_, i) => cards.create(ownerId, boardId, listA, { title: `N${i}` })));
    const rows = await titles(listA);
    expect(rows.map(([, position]) => position)).toEqual(rows.map((_, index) => index + 1));
  });

  it("never deletes a list that receives a card concurrently (CB22, N79)", async () => {
    const empty = randomUUID();
    await dataSource.query(`INSERT INTO lists (id, board_id, name, position) VALUES ($1, $2, 'Vazia', 3)`, [empty, boardId]);

    const [created, deleted] = await Promise.allSettled([
      cards.create(ownerId, boardId, empty, { title: "Chegou" }),
      lists.delete(ownerId, boardId, empty),
    ]);

    const cardsLeft = (await titles(empty)).length;
    const listLeft = ((await dataSource.query(`SELECT 1 FROM lists WHERE id = $1`, [empty])) as unknown[]).length;
    // Either the card was created first and the deletion refused, or the list went first and creation failed.
    if (created.status === "fulfilled") {
      expect(deleted.status).toBe("rejected");
      // Without a rule, a list that received a card is never deleted (RF05 RN01).
      expect(((deleted as PromiseRejectedResult).reason as AppError).code).toBe("LIST_DELETION_STRATEGY_REQUIRED");
      expect([cardsLeft, listLeft]).toEqual([1, 1]);
    } else {
      expect(((created as PromiseRejectedResult).reason as AppError).code).toBe("LIST_NOT_FOUND");
      expect(listLeft).toBe(0);
    }
  });

  it("rolls back content and positions when the move fails (CE04, RN12)", async () => {
    const repository = new TypeOrmBoardCardRepository(dataSource);
    const c1 = await idOf("C1");
    await expect(
      repository.withBoardLock({ userId: ownerId }, boardId, async (tx) => {
        await tx.updateContent(c1, "Mudou", "descrição", null);
        await tx.openGap(listB, 1);
        await tx.relocate(c1, listB, 2); // P1 is now at 2: violates the unique constraint
      }),
    ).rejects.toThrow();
    expect(await titles(listA)).toEqual([
      ["C1", 1],
      ["C2", 2],
      ["C3", 3],
    ]);
    expect(await titles(listB)).toEqual([["P1", 1]]);
  });

  it("stores no description as NULL and rejects an empty string (D21)", async () => {
    const c1 = await idOf("C1");
    await cards.update(ownerId, boardId, c1, { title: "C1", description: null, listId: listA, position: 1, dueDate: null });
    expect((await cards.get(ownerId, boardId, c1)).description).toBeNull();
    await expect(dataSource.query(`UPDATE cards SET description = '' WHERE id = $1`, [c1])).rejects.toThrow();
  });

  it("returns lists with their cards in the board detail order (CA01, C83)", async () => {
    const result = await cards.create(ownerId, boardId, listB, { title: "P2" });
    expect(result.lists.map((l) => [l.cardCount, l.cards.map((c) => c.title)])).toEqual([[2, ["P1", "P2"]]]);
  });

  it("migration renumbers 0-based card positions to 1..N (3.2, C91)", async () => {
    await dataSource.undoLastMigration(); // RF10
    await dataSource.undoLastMigration(); // RF09
    await dataSource.undoLastMigration(); // RF08
    await dataSource.undoLastMigration(); // RF07
    await dataSource.undoLastMigration(); // RF06
    await dataSource.undoLastMigration(); // RF05
    await dataSource.undoLastMigration(); // RF04: positions back to 0-based
    await dataSource.runMigrations();
    expect(await titles(listA)).toEqual([
      ["C1", 1],
      ["C2", 2],
      ["C3", 3],
    ]);
  });
});
