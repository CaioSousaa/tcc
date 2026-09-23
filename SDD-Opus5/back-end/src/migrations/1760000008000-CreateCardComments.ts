import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCardComments1760000008000 implements MigrationInterface {
  name = "CreateCardComments1760000008000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "card_comments" (
        "id" uuid NOT NULL,
        "card_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "body" varchar(2000) NOT NULL,
        -- clock_timestamp(): distinct moments even inside one transaction (RF09 D43).
        "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
        "edited_at" timestamptz NULL,
        CONSTRAINT "PK_card_comments_id" PRIMARY KEY ("id"),
        -- Comments go only with their card (RF09 F123).
        CONSTRAINT "FK_card_comments_card" FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE,
        -- Not tied to board membership: comments survive the author leaving (D45).
        CONSTRAINT "FK_card_comments_author" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_card_comments_body_length" CHECK (char_length("body") BETWEEN 1 AND 2000)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_card_comments_card_order" ON "card_comments" ("card_id", "created_at", "id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "card_comments"`);
  }
}
