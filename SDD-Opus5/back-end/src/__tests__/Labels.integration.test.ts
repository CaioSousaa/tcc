import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LABELS_MAX } from "../domain/labels";
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
import { TypeOrmBoardRepository } from "../repositories/BoardRepository";
import { TypeOrmCardLabelRepository } from "../repositories/CardLabelRepository";
import { TypeOrmLabelRepository } from "../repositories/LabelRepository";
import { loadListsWithCards } from "../repositories/listsWithCards";
import { BoardService } from "../services/BoardService";
import { CardLabelService } from "../services/CardLabelService";
import { CardService } from "../services/CardService";
import { LabelService } from "../services/LabelService";

/** Integration tests against a real PostgreSQL (RF08 N183). Skipped without TEST_DATABASE_URL; drops every table. */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("Labels (PostgreSQL)", () => {
  let dataSource: DataSource;
  let boards: BoardService;
  let cards: CardService;
  let labels: LabelService;
  let cardLabels: CardLabelService;
  let caio: string;
  let boardId: string;
  let listId: string;
  let cardId: string;

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
    labels = new LabelService(new TypeOrmLabelRepository(dataSource));
    cardLabels = new CardLabelService(new TypeOrmCardLabelRepository(dataSource));
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
    listId = board.lists[0]?.id ?? "";
    cardId = (await cards.create(caio, boardId, listId, { title: "Refatorar" })).card.id;
  });

  const count = async (sql: string, params: unknown[] = []) =>
    Number(((await dataSource.query(sql, params)) as Array<{ n: number }>)[0]?.n ?? 0);

  it("enforces the case-insensitive unique name at the database level (RN04, F104)", async () => {
    await labels.create(caio, boardId, { name: "Bug", color: "red" });
    await expect(
      dataSource.query(`INSERT INTO labels (id, board_id, name, color) VALUES ($1, $2, 'BUG', 'blue')`, [randomUUID(), boardId]),
    ).rejects.toThrow();
    await expect(
      dataSource.query(`INSERT INTO labels (id, board_id, name, color) VALUES ($1, $2, 'Revisão', 'blue')`, [randomUUID(), boardId]),
    ).resolves.toBeDefined();
  });

  it("refuses an application across boards through the composite foreign key (F100, N166)", async () => {
    const other = await boards.create(caio, { name: "Infra", color: "green", withDefaultLists: false });
    const foreign = (await labels.create(caio, other.id, { name: "Bug", color: "red" })).label.id;
    await expect(cardLabels.apply(caio, boardId, cardId, foreign)).rejects.toMatchObject({ code: "LABEL_NOT_FOUND" });
    await expect(
      dataSource.query(`INSERT INTO card_labels (card_id, label_id, board_id) VALUES ($1, $2, $3)`, [cardId, foreign, boardId]),
    ).rejects.toThrow();
  });

  it("cascades applications when the label or the card is deleted (F99, RN10, RN12)", async () => {
    const bug = (await labels.create(caio, boardId, { name: "Bug", color: "red" })).label.id;
    const ux = (await labels.create(caio, boardId, { name: "UX", color: "purple" })).label.id;
    await cardLabels.apply(caio, boardId, cardId, bug);
    await cardLabels.apply(caio, boardId, cardId, ux);
    await labels.delete(caio, boardId, bug);
    expect(await count(`SELECT count(*)::int AS n FROM card_labels`)).toBe(1);
    await cards.delete(caio, boardId, cardId);
    expect(await count(`SELECT count(*)::int AS n FROM card_labels`)).toBe(0);
    expect(await count(`SELECT count(*)::int AS n FROM labels`)).toBe(1);
  });

  it("aggregates labelIds in label order and usage per label (N160, N161, RN11)", async () => {
    const bug = (await labels.create(caio, boardId, { name: "Bug", color: "red" })).label.id;
    const urgente = (await labels.create(caio, boardId, { name: "Urgente", color: "amber" })).label.id;
    await cardLabels.apply(caio, boardId, cardId, urgente);
    const { labels: after } = await cardLabels.apply(caio, boardId, cardId, bug);
    const [list] = await loadListsWithCards(dataSource.manager, boardId, [listId]);
    expect(list?.cards[0]?.labelIds).toEqual([bug, urgente]);
    expect(after.map((label) => [label.name, label.usage])).toEqual([
      ["Bug", 1],
      ["Urgente", 1],
    ]);
    expect((await boards.get(caio, boardId)).labels.map((label) => label.name)).toEqual(["Bug", "Urgente"]);
  });

  it("never exceeds 50 labels with simultaneous creations (CB10, N169)", async () => {
    for (let i = 0; i < LABELS_MAX - 2; i += 1) await labels.create(caio, boardId, { name: `L${i}`, color: "gray" });
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, (_, i) => labels.create(caio, boardId, { name: `X${i}`, color: "red" })),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    const refused = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
    expect((refused?.reason as AppError).code).toBe("LABEL_LIMIT_REACHED");
    expect(await count(`SELECT count(*)::int AS n FROM labels WHERE board_id = $1`, [boardId])).toBe(LABELS_MAX);
  });

  it("applies once with simultaneous requests (CB11, N170)", async () => {
    const bug = (await labels.create(caio, boardId, { name: "Bug", color: "red" })).label.id;
    await Promise.all(Array.from({ length: 5 }, () => cardLabels.apply(caio, boardId, cardId, bug)));
    expect(await count(`SELECT count(*)::int AS n FROM card_labels`)).toBe(1);
  });

  it("migration is reversible (D36)", async () => {
    await dataSource.undoLastMigration(); // RF10
    await dataSource.undoLastMigration(); // RF09
    await dataSource.undoLastMigration(); // RF08
    expect(await count(`SELECT count(*)::int AS n FROM pg_tables WHERE tablename IN ('labels', 'card_labels')`)).toBe(0);
    await dataSource.runMigrations();
    expect(await count(`SELECT count(*)::int AS n FROM pg_tables WHERE tablename IN ('labels', 'card_labels')`)).toBe(2);
  });
});
