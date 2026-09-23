import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { COMMENTS_MAX } from "../domain/comments";
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
import { TypeOrmCommentRepository } from "../repositories/CommentRepository";
import { TypeOrmMemberRepository } from "../repositories/MemberRepository";
import { loadListsWithCards } from "../repositories/listsWithCards";
import { BoardService } from "../services/BoardService";
import { CardService } from "../services/CardService";
import { CommentService } from "../services/CommentService";
import { MemberService } from "../services/MemberService";

/** Integration tests against a real PostgreSQL (RF09 N200). Skipped without TEST_DATABASE_URL; drops every table. */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("Comments (PostgreSQL)", () => {
  let dataSource: DataSource;
  let boards: BoardService;
  let cards: CardService;
  let comments: CommentService;
  let members: MemberService;
  let caio: string;
  let joao: string;
  let boardId: string;
  let listId: string;
  let cardId: string;

  const addUser = async (name: string) => {
    const id = randomUUID();
    await dataSource.query(`INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, 'x')`, [id, name, `${id}@t.dev`]);
    return id;
  };

  const count = async (sql: string, params: unknown[] = []) =>
    Number(((await dataSource.query(sql, params)) as Array<{ n: number }>)[0]?.n ?? 0);

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
    comments = new CommentService(new TypeOrmCommentRepository(dataSource));
    members = new MemberService(new TypeOrmMemberRepository(dataSource));
  });

  afterAll(async () => {
    await dataSource?.destroy();
  });

  beforeEach(async () => {
    for (const table of ["boards", "users"]) await dataSource.query(`DELETE FROM ${table}`);
    caio = await addUser("Caio");
    joao = await addUser("Joao");
    const board = await boards.create(caio, { name: "Sprint", color: "navy", withDefaultLists: true });
    boardId = board.id;
    listId = board.lists[0]?.id ?? "";
    await dataSource.query(`INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'member')`, [boardId, joao]);
    cardId = (await cards.create(caio, boardId, listId, { title: "Refatorar" })).card.id;
  });

  it("enforces the body length at the database level (C214)", async () => {
    const insert = (body: string) =>
      dataSource.query(`INSERT INTO card_comments (id, card_id, author_id, body) VALUES ($1, $2, $3, $4)`, [randomUUID(), cardId, caio, body]);
    await expect(insert("")).rejects.toThrow();
    await expect(insert("a".repeat(2000))).resolves.toBeDefined();
  });

  it("keeps a stable order and counts comments in the cards statement (D43, N185)", async () => {
    const first = await comments.create(caio, boardId, cardId, { body: "1" });
    await comments.create(joao, boardId, cardId, { body: "2" });
    const { comments: history } = await comments.create(caio, boardId, cardId, { body: "3" });
    expect(history.map((c) => c.body)).toEqual(["1", "2", "3"]);
    expect(history[0]?.id).toBe(first.comment.id);
    const [list] = await loadListsWithCards(dataSource.manager, boardId, [listId]);
    expect(list?.cards[0]?.commentCount).toBe(3);
  });

  it("marks edited only when the text changes and never changes the moment (RN06, D44)", async () => {
    const { comment } = await comments.create(joao, boardId, cardId, { body: "Ok" });
    expect((await comments.update(joao, boardId, cardId, comment.id, { body: "Ok" })).comment.edited).toBe(false);
    const edited = await comments.update(joao, boardId, cardId, comment.id, { body: "Ok!" });
    expect(edited.comment).toMatchObject({ edited: true, createdAt: comment.createdAt });
  });

  it("cascades with the card (F123)", async () => {
    await comments.create(caio, boardId, cardId, { body: "Some" });
    await cards.delete(caio, boardId, cardId);
    expect(await count(`SELECT count(*)::int AS n FROM card_comments`)).toBe(0);
  });

  it("keeps comments of an author removed from the board (RN09, CA26)", async () => {
    await comments.create(joao, boardId, cardId, { body: "Fica" });
    await members.removeMember(caio, boardId, joao);
    const history = await comments.list(caio, boardId, cardId);
    expect(history.map((c) => [c.author.name, c.body])).toEqual([["Joao", "Fica"]]);
  });

  it("never exceeds 500 comments with simultaneous publications (CB13, N189)", async () => {
    await dataSource.query(
      `INSERT INTO card_comments (id, card_id, author_id, body)
       SELECT gen_random_uuid(), $1, $2, 'x' FROM generate_series(1, $3::int)`,
      [cardId, caio, COMMENTS_MAX - 2],
    );
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, (_, i) => comments.create(i % 2 ? joao : caio, boardId, cardId, { body: `c${i}` })),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    const refused = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
    expect((refused?.reason as AppError).code).toBe("COMMENT_LIMIT_REACHED");
    expect(await count(`SELECT count(*)::int AS n FROM card_comments WHERE card_id = $1`, [cardId])).toBe(COMMENTS_MAX);
  });

  it("migration is reversible (D42)", async () => {
    await dataSource.undoLastMigration(); // RF10
    await dataSource.undoLastMigration(); // RF09
    expect(await count(`SELECT count(*)::int AS n FROM pg_tables WHERE tablename = 'card_comments'`)).toBe(0);
    await dataSource.runMigrations();
    expect(await count(`SELECT count(*)::int AS n FROM pg_tables WHERE tablename = 'card_comments'`)).toBe(1);
  });
});
