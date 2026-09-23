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
 * Integration tests against a real PostgreSQL (RF05 N110). Skipped unless
 * TEST_DATABASE_URL points to a disposable database: every table is dropped.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("List deletion with cards (PostgreSQL)", () => {
  let dataSource: DataSource;
  let lists: ListService;
  let cards: CardService;
  let ownerId: string;
  let boardId: string;
  let revisao: string;
  let concluido: string;

  const titles = async (listId: string) =>
    ((await dataSource.query(`SELECT title FROM cards WHERE list_id = $1 ORDER BY position`, [listId])) as Array<{ title: string }>).map(
      (row) => row.title,
    );

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
    lists = new ListService(new TypeOrmBoardListRepository(dataSource));
    cards = new CardService(new TypeOrmBoardCardRepository(dataSource));
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
    revisao = randomUUID();
    concluido = randomUUID();
    await dataSource.query(`INSERT INTO users (id, name, email, password_hash) VALUES ($1, 'Ana', $2, 'x')`, [ownerId, `${ownerId}@t.dev`]);
    await dataSource.query(`INSERT INTO boards (id, owner_id, name, color) VALUES ($1, $2, 'Sprint', 'navy')`, [boardId, ownerId]);
    await dataSource.query(`INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'admin')`, [boardId, ownerId]);
    await dataSource.query(`INSERT INTO lists (id, board_id, name, position) VALUES ($1, $2, 'Revisão', 1), ($3, $2, 'Concluído', 2)`, [
      revisao,
      boardId,
      concluido,
    ]);
    for (const [index, title] of ["R1", "R2", "R3", "R4"].entries()) {
      await dataSource.query(`INSERT INTO cards (id, list_id, title, position) VALUES ($1, $2, $3, $4)`, [randomUUID(), revisao, title, index + 1]);
    }
    await dataSource.query(`INSERT INTO cards (id, list_id, title, position) VALUES ($1, $2, 'D1', 1)`, [randomUUID(), concluido]);
  });

  it("appends cards in one statement without violating UQ_cards_list_position (F57)", async () => {
    await lists.delete(ownerId, boardId, revisao, { strategy: "move", targetListId: concluido, expectedCardCount: 4 });
    expect(await titles(concluido)).toEqual(["D1", "R1", "R2", "R3", "R4"]);
    const positions = (await dataSource.query(`SELECT position FROM cards WHERE list_id = $1 ORDER BY position`, [concluido])) as Array<{ position: number }>;
    expect(positions.map((row) => Number(row.position))).toEqual([1, 2, 3, 4, 5]);
  });

  it("removes the cards through ON DELETE CASCADE (F54)", async () => {
    await lists.delete(ownerId, boardId, revisao, { strategy: "cascade", targetListId: undefined, expectedCardCount: 4 });
    expect(((await dataSource.query(`SELECT count(*)::int AS n FROM cards`)) as Array<{ n: number }>)[0]?.n).toBe(1);
  });

  it("reads the lock under the board row lock (RN03)", async () => {
    await dataSource.query(`UPDATE boards SET lock_list_deletion = true WHERE id = $1`, [boardId]);
    const error = await lists.delete(ownerId, boardId, revisao, { strategy: "cascade", targetListId: undefined, expectedCardCount: 4 }).catch((e: unknown) => e);
    expect((error as AppError).code).toBe("LIST_DELETION_LOCKED");
  });

  it("never loses a card created while the list is being deleted (RN11, CA23)", async () => {
    const [created, deleted] = await Promise.allSettled([
      cards.create(ownerId, boardId, revisao, { title: "R5" }),
      lists.delete(ownerId, boardId, revisao, { strategy: "move", targetListId: concluido, expectedCardCount: 4 }),
    ]);

    if (deleted.status === "fulfilled") {
      // Deletion ran first: creation found no list, and all 4 cards moved.
      expect((created as PromiseRejectedResult).reason).toBeInstanceOf(AppError);
      expect(await titles(concluido)).toEqual(["D1", "R1", "R2", "R3", "R4"]);
    } else {
      // Creation ran first: the count no longer matched and nothing was deleted.
      expect(((deleted as PromiseRejectedResult).reason as AppError).code).toBe("LIST_CARD_COUNT_CHANGED");
      expect(await titles(revisao)).toEqual(["R1", "R2", "R3", "R4", "R5"]);
    }
  });

  it("migration adds the column with false for existing boards and is reversible (C94)", async () => {
    await dataSource.undoLastMigration(); // RF10
    await dataSource.undoLastMigration(); // RF09
    await dataSource.undoLastMigration(); // RF08
    await dataSource.undoLastMigration(); // RF07
    await dataSource.undoLastMigration(); // RF06
    await dataSource.undoLastMigration(); // RF05
    await dataSource.runMigrations();
    const rows = (await dataSource.query(`SELECT lock_list_deletion FROM boards WHERE id = $1`, [boardId])) as Array<{ lock_list_deletion: boolean }>;
    expect(rows[0]?.lock_list_deletion).toBe(false);
  });
});
