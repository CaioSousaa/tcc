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
import { TypeOrmBoardListRepository } from "../repositories/BoardListRepository";
import { ListService } from "../services/ListService";

/**
 * Integration tests against a real PostgreSQL (N66). Skipped unless
 * TEST_DATABASE_URL points to a disposable database: every table is dropped.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("TypeOrmBoardListRepository (PostgreSQL)", () => {
  let dataSource: DataSource;
  let service: ListService;
  let ownerId: string;
  let boardId: string;

  const positions = async (id = boardId) =>
    (
      (await dataSource.query(`SELECT name, position FROM lists WHERE board_id = $1 ORDER BY position`, [id])) as Array<{
        name: string;
        position: number;
      }>
    ).map((row) => [row.name, Number(row.position)]);

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
    service = new ListService(new TypeOrmBoardListRepository(dataSource));
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
    await dataSource.query(`INSERT INTO users (id, name, email, password_hash) VALUES ($1, 'Ana', $2, 'x')`, [
      ownerId,
      `${ownerId}@test.dev`,
    ]);
    await dataSource.query(`INSERT INTO boards (id, owner_id, name, color) VALUES ($1, $2, 'Sprint', 'navy')`, [
      boardId,
      ownerId,
    ]);
    await dataSource.query(`INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'admin')`, [boardId, ownerId]);
    for (const [index, name] of ["A fazer", "Em progresso", "Concluído"].entries()) {
      await dataSource.query(`INSERT INTO lists (id, board_id, name, position) VALUES ($1, $2, $3, $4)`, [
        randomUUID(),
        boardId,
        name,
        index + 1,
      ]);
    }
  });

  it("serializes concurrent creations and keeps positions 1..N (CB12, RN05, C46)", async () => {
    await Promise.all(
      Array.from({ length: 12 }, (_, i) => service.create(ownerId, boardId, { name: `L${i}`, position: 2 })),
    );
    const rows = await positions();
    expect(rows).toHaveLength(15);
    expect(rows.map(([, position]) => position)).toEqual(rows.map((_, index) => index + 1));
  });

  it("moves with a single statement without violating the unique constraint (F26, D19)", async () => {
    const [first] = (await dataSource.query(`SELECT id FROM lists WHERE board_id = $1 AND position = 1`, [boardId])) as Array<{ id: string }>;
    await service.update(ownerId, boardId, first?.id ?? "", { name: "A fazer", position: 3 });
    expect(await positions()).toEqual([
      ["Em progresso", 1],
      ["Concluído", 2],
      ["A fazer", 3],
    ]);
  });

  it("rolls back the shift when the insert fails (CE03, RN10)", async () => {
    const repository = new TypeOrmBoardListRepository(dataSource);
    await expect(
      repository.withBoardLock({ userId: ownerId }, boardId, async (tx) => {
        await tx.shiftRight(1);
        await tx.insert({ id: randomUUID(), name: "x".repeat(51), position: 1 }); // violates CHECK
      }),
    ).rejects.toThrow();
    expect(await positions()).toEqual([
      ["A fazer", 1],
      ["Em progresso", 2],
      ["Concluído", 3],
    ]);
  });

  it("refuses to delete a list with cards without a rule (RF05 RN01, CB01)", async () => {
    const [list] = (await dataSource.query(`SELECT id FROM lists WHERE board_id = $1 AND position = 2`, [boardId])) as Array<{ id: string }>;
    await dataSource.query(`INSERT INTO cards (id, list_id, title, position) VALUES ($1, $2, 'card', 1)`, [
      randomUUID(),
      list?.id,
    ]);
    const error = await service.delete(ownerId, boardId, list?.id ?? "").catch((reason: unknown) => reason);
    expect((error as AppError).code).toBe("LIST_DELETION_STRATEGY_REQUIRED");
    expect(await positions()).toHaveLength(3);
  });

  it("does not reach a board of another owner (CA35, N48)", async () => {
    const error = await service.create(randomUUID(), boardId, { name: "Hack", position: 1 }).catch((reason: unknown) => reason);
    expect((error as AppError).code).toBe("BOARD_NOT_FOUND");
    expect(await positions()).toHaveLength(3);
  });

  it("returns card counts per list (CA02, C64)", async () => {
    const [list] = (await dataSource.query(`SELECT id FROM lists WHERE board_id = $1 AND position = 2`, [boardId])) as Array<{ id: string }>;
    for (let i = 1; i <= 2; i += 1) {
      await dataSource.query(`INSERT INTO cards (id, list_id, title, position) VALUES ($1, $2, 'c', $3)`, [
        randomUUID(),
        list?.id,
        i,
      ]);
    }
    const result = await service.create(ownerId, boardId, { name: "Arquivo", position: undefined });
    expect(result.lists.map((l) => l.cardCount)).toEqual([0, 2, 0, 0]);
  });

  it("migration renumbers 0-based positions to 1..N (3.2, C65)", async () => {
    // The RF03 down migration subtracts 1, leaving 0-based positions to renumber.
    // Undo the RF10, RF09, RF08, RF07, RF06, RF05 and RF04 migrations first, then the RF03 one (which moves positions to 0-based).
    for (let i = 0; i < 8; i += 1) await dataSource.undoLastMigration();
    await dataSource.runMigrations();
    expect(await positions()).toEqual([
      ["A fazer", 1],
      ["Em progresso", 2],
      ["Concluído", 3],
    ]);
  });
});
