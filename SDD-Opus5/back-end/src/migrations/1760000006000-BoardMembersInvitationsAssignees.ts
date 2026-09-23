import type { MigrationInterface, QueryRunner } from "typeorm";

export class BoardMembersInvitationsAssignees1760000006000 implements MigrationInterface {
  name = "BoardMembersInvitationsAssignees1760000006000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "board_members" (
        "board_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" varchar(16) NOT NULL,
        "joined_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_members" PRIMARY KEY ("board_id", "user_id"),
        CONSTRAINT "FK_board_members_board" FOREIGN KEY ("board_id") REFERENCES "boards" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_board_members_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_board_members_role" CHECK ("role" IN ('admin', 'member'))
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_board_members_user" ON "board_members" ("user_id", "board_id")`);

    await queryRunner.query(`
      CREATE TABLE "board_invitations" (
        "id" uuid NOT NULL,
        "board_id" uuid NOT NULL,
        "email" varchar(254) NOT NULL,
        "role" varchar(16) NOT NULL,
        "invited_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_invitations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_board_invitations_board" FOREIGN KEY ("board_id") REFERENCES "boards" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_board_invitations_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_board_invitations_role" CHECK ("role" IN ('admin', 'member')),
        -- Last barrier against two simultaneous invitations to the same e-mail (RF07 F87).
        CONSTRAINT "UQ_board_invitations_board_email" UNIQUE ("board_id", "email")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_board_invitations_email" ON "board_invitations" ("email", "created_at" DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE "card_assignees" (
        "card_id" uuid NOT NULL,
        "board_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "assigned_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_card_assignees" PRIMARY KEY ("card_id", "user_id"),
        CONSTRAINT "FK_card_assignees_card" FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE,
        -- Leaving the board removes the assignments in the same statement (RF07 F83, D32).
        CONSTRAINT "FK_card_assignees_member" FOREIGN KEY ("board_id", "user_id")
          REFERENCES "board_members" ("board_id", "user_id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_card_assignees_board_user" ON "card_assignees" ("board_id", "user_id")`);

    // Every existing board gets its owner as the only administrator (RF07 RN01, D31).
    await queryRunner.query(`
      INSERT INTO "board_members" ("board_id", "user_id", "role", "joined_at")
      SELECT "id", "owner_id", 'admin', "created_at" FROM "boards"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "card_assignees"`);
    await queryRunner.query(`DROP TABLE "board_invitations"`);
    await queryRunner.query(`DROP TABLE "board_members"`);
  }
}
