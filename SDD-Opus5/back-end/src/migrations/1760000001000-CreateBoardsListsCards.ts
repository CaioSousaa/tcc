import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBoardsListsCards1760000001000 implements MigrationInterface {
  name = "CreateBoardsListsCards1760000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "boards" (
        "id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        "name" varchar(60) NOT NULL,
        "color" varchar(16) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_boards_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_boards_owner" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_boards_name_length" CHECK (char_length("name") BETWEEN 1 AND 60),
        CONSTRAINT "CHK_boards_color" CHECK ("color" IN ('navy', 'blue', 'green', 'amber', 'purple'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_boards_owner_created" ON "boards" ("owner_id", "created_at" DESC, "id" DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE "lists" (
        "id" uuid NOT NULL,
        "board_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "position" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lists_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lists_board" FOREIGN KEY ("board_id") REFERENCES "boards" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_lists_position" CHECK ("position" >= 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_lists_board_position" ON "lists" ("board_id", "position")`);

    await queryRunner.query(`
      CREATE TABLE "cards" (
        "id" uuid NOT NULL,
        "list_id" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "position" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cards_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cards_list" FOREIGN KEY ("list_id") REFERENCES "lists" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_cards_position" CHECK ("position" >= 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_cards_list" ON "cards" ("list_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_cards_list"`);
    await queryRunner.query(`DROP TABLE "cards"`);
    await queryRunner.query(`DROP INDEX "IDX_lists_board_position"`);
    await queryRunner.query(`DROP TABLE "lists"`);
    await queryRunner.query(`DROP INDEX "IDX_boards_owner_created"`);
    await queryRunner.query(`DROP TABLE "boards"`);
  }
}
