import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BOARD_PEOPLE_MAX } from "../domain/members";
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
import { TypeOrmAssigneeRepository } from "../repositories/AssigneeRepository";
import { TypeOrmBoardRepository } from "../repositories/BoardRepository";
import { TypeOrmInvitationRepository } from "../repositories/InvitationRepository";
import { TypeOrmMemberRepository } from "../repositories/MemberRepository";
import { AssigneeService } from "../services/AssigneeService";
import { BoardService } from "../services/BoardService";
import { InvitationService } from "../services/InvitationService";
import { MemberService } from "../services/MemberService";

/** Integration tests against a real PostgreSQL (RF07 N159). Skipped without TEST_DATABASE_URL; drops every table. */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("Members (PostgreSQL)", () => {
  let dataSource: DataSource;
  let boards: BoardService;
  let members: MemberService;
  let invitations: InvitationService;
  let assignees: AssigneeService;
  let caio: string;
  let marina: string;
  let joao: string;
  let boardId: string;
  let cardId: string;

  const addUser = async (name: string) => {
    const id = randomUUID();
    await dataSource.query(`INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, 'x')`, [
      id,
      name,
      `${name.toLowerCase()}-${id}@t.dev`,
    ]);
    return id;
  };

  const addMember = (userId: string, role: "admin" | "member") =>
    dataSource.query(`INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)`, [boardId, userId, role]);

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
    members = new MemberService(new TypeOrmMemberRepository(dataSource));
    invitations = new InvitationService(new TypeOrmInvitationRepository(dataSource));
    assignees = new AssigneeService(new TypeOrmAssigneeRepository(dataSource));
  });

  afterAll(async () => {
    await dataSource?.destroy();
  });

  beforeEach(async () => {
    for (const table of ["boards", "users"]) await dataSource.query(`DELETE FROM ${table}`);
    caio = await addUser("Caio");
    marina = await addUser("Marina");
    joao = await addUser("Joao");
    const board = await boards.create(caio, { name: "Sprint", color: "navy", withDefaultLists: true });
    boardId = board.id;
    await addMember(marina, "admin");
    await addMember(joao, "member");
    cardId = randomUUID();
    await dataSource.query(`INSERT INTO cards (id, list_id, title, position) VALUES ($1, $2, 'Refatorar', 1)`, [
      cardId,
      board.lists[0]?.id,
    ]);
  });

  it("migration turns existing owners into administrators and is reversible (D31, C144)", async () => {
    await dataSource.undoLastMigration(); // RF10
    await dataSource.undoLastMigration(); // RF09
    await dataSource.undoLastMigration(); // RF08
    await dataSource.undoLastMigration(); // RF07
    await dataSource.runMigrations();
    const rows = (await dataSource.query(`SELECT user_id, role FROM board_members WHERE board_id = $1`, [boardId])) as Array<{
      user_id: string;
      role: string;
    }>;
    expect(rows).toEqual([{ user_id: caio, role: "admin" }]);
  });

  it("removes assignments through the composite foreign key when a participant leaves (F83, CA22)", async () => {
    await assignees.assign(caio, boardId, cardId, joao);
    await members.removeMember(caio, boardId, joao);
    const rows = (await dataSource.query(`SELECT count(*)::int AS n FROM card_assignees`)) as Array<{ n: number }>;
    expect(rows[0]?.n).toBe(0);
  });

  it("refuses assigning a non participant, also at the database level (CA36, D32)", async () => {
    const bruno = await addUser("Bruno");
    await expect(assignees.assign(caio, boardId, cardId, bruno)).rejects.toMatchObject({ code: "ASSIGNEE_NOT_MEMBER" });
    await expect(
      dataSource.query(`INSERT INTO card_assignees (card_id, board_id, user_id) VALUES ($1, $2, $3)`, [cardId, boardId, bruno]),
    ).rejects.toThrow();
  });

  it("ends with exactly one administrator on simultaneous demotions (CA21, N146)", async () => {
    await Promise.allSettled([
      members.updateMember(caio, boardId, marina, { role: "member" }),
      members.updateMember(marina, boardId, caio, { role: "member" }),
    ]);
    const rows = (await dataSource.query(
      `SELECT count(*)::int AS n FROM board_members WHERE board_id = $1 AND role = 'admin'`,
      [boardId],
    )) as Array<{ n: number }>;
    expect(rows[0]?.n).toBe(1);
  });

  it("never goes over 50 people with simultaneous invitations (CB08, N147)", async () => {
    for (let i = 0; i < BOARD_PEOPLE_MAX - 5; i += 1) {
      await members.invite(caio, boardId, { email: `p${i}@t.dev`, role: "member" });
    }
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, (_, i) => members.invite(i % 2 ? marina : caio, boardId, { email: `x${i}@t.dev`, role: "member" })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const state = await members.get(caio, boardId);
    expect(state.members.length + state.invitations.length).toBe(BOARD_PEOPLE_MAX);
    const refused = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    expect((refused?.reason as AppError).code).toBe("MEMBER_LIMIT_REACHED");
  });

  it("serializes accept and cancel of the same invitation (CB12)", async () => {
    const ana = await addUser("Ana");
    const anaEmail = ((await dataSource.query(`SELECT email FROM users WHERE id = $1`, [ana])) as Array<{ email: string }>)[0]?.email ?? "";
    const { invitations: pending } = await members.invite(caio, boardId, { email: anaEmail, role: "member" });
    const invitationId = pending[0]?.id ?? "";

    const [accepted, cancelled] = await Promise.allSettled([
      invitations.accept({ id: ana, email: anaEmail }, invitationId),
      members.cancelInvitation(caio, boardId, invitationId),
    ]);
    expect([accepted.status, cancelled.status].sort()).toEqual(["fulfilled", "rejected"]);
    const left = (await dataSource.query(`SELECT count(*)::int AS n FROM board_invitations`)) as Array<{ n: number }>;
    expect(left[0]?.n).toBe(0);
  });

  it("lists boards with role, count and a preview of 4 in one statement (N135)", async () => {
    await addMember(await addUser("Ana"), "member");
    await addMember(await addUser("Bruno"), "member");

    const statements: string[] = [];
    const original = dataSource.query.bind(dataSource);
    dataSource.query = (async (query: string, parameters?: unknown[]) => {
      statements.push(query);
      return original(query, parameters);
    }) as typeof dataSource.query;
    try {
      const [sprint] = await boards.list(joao);
      expect(sprint).toMatchObject({ myRole: "member", memberCount: 5 });
      expect(sprint?.memberPreview.map((p) => p.name)).toEqual(["Caio", "Marina", "Joao", "Ana"]);
    } finally {
      dataSource.query = original;
    }
    expect(statements).toHaveLength(1);
  });
});
