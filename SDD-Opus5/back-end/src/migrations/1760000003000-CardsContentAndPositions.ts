import type { MigrationInterface, QueryRunner } from "typeorm";

export class CardsContentAndPositions1760000003000 implements MigrationInterface {
  name = "CardsContentAndPositions1760000003000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Renumber to contiguous 1..N per list.
    await queryRunner.query(`
      UPDATE "cards" AS c
         SET "position" = r.rn
        FROM (
          SELECT "id", ROW_NUMBER() OVER (PARTITION BY "list_id" ORDER BY "position", "created_at", "id") AS rn
            FROM "cards"
        ) AS r
       WHERE r."id" = c."id"
    `);

    // 2. Positions start at 1.
    await queryRunner.query(`ALTER TABLE "cards" DROP CONSTRAINT "CHK_cards_position"`);
    await queryRunner.query(`ALTER TABLE "cards" ADD CONSTRAINT "CHK_cards_position" CHECK ("position" >= 1)`);

    // 3. Title length.
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "CHK_cards_title_length" CHECK (char_length("title") BETWEEN 1 AND 200)`,
    );

    // 4. Optional description; "no description" is NULL, never an empty string (D21).
    await queryRunner.query(`ALTER TABLE "cards" ADD COLUMN "description" text NULL`);
    await queryRunner.query(`
      ALTER TABLE "cards" ADD CONSTRAINT "CHK_cards_description_length"
        CHECK ("description" IS NULL OR char_length("description") BETWEEN 1 AND 5000)
    `);

    // 5. No repeated positions per list; checked at the end of each statement (D22).
    await queryRunner.query(`DROP INDEX "IDX_cards_list"`);
    await queryRunner.query(`
      ALTER TABLE "cards"
        ADD CONSTRAINT "UQ_cards_list_position" UNIQUE ("list_id", "position") DEFERRABLE INITIALLY IMMEDIATE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cards" DROP CONSTRAINT "UQ_cards_list_position"`);
    await queryRunner.query(`CREATE INDEX "IDX_cards_list" ON "cards" ("list_id")`);

    await queryRunner.query(`ALTER TABLE "cards" DROP CONSTRAINT "CHK_cards_description_length"`);
    await queryRunner.query(`ALTER TABLE "cards" DROP COLUMN "description"`);

    await queryRunner.query(`ALTER TABLE "cards" DROP CONSTRAINT "CHK_cards_title_length"`);

    await queryRunner.query(`ALTER TABLE "cards" DROP CONSTRAINT "CHK_cards_position"`);
    await queryRunner.query(`UPDATE "cards" SET "position" = "position" - 1`);
    await queryRunner.query(`ALTER TABLE "cards" ADD CONSTRAINT "CHK_cards_position" CHECK ("position" >= 0)`);
  }
}
