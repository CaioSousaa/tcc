import type { MigrationInterface, QueryRunner } from "typeorm";

export class ListPositionsAndNameLimit1760000002000 implements MigrationInterface {
  name = "ListPositionsAndNameLimit1760000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Renumber to contiguous 1..N per board.
    await queryRunner.query(`
      UPDATE "lists" AS l
         SET "position" = r.rn
        FROM (
          SELECT "id", ROW_NUMBER() OVER (PARTITION BY "board_id" ORDER BY "position", "created_at", "id") AS rn
            FROM "lists"
        ) AS r
       WHERE r."id" = l."id"
    `);

    // 2. Positions start at 1.
    await queryRunner.query(`ALTER TABLE "lists" DROP CONSTRAINT "CHK_lists_position"`);
    await queryRunner.query(`ALTER TABLE "lists" ADD CONSTRAINT "CHK_lists_position" CHECK ("position" >= 1)`);

    // 3. Name limit. Fails (and rolls back) if a longer name exists; never truncates (D18).
    await queryRunner.query(`ALTER TABLE "lists" ALTER COLUMN "name" TYPE varchar(50)`);
    await queryRunner.query(
      `ALTER TABLE "lists" ADD CONSTRAINT "CHK_lists_name_length" CHECK (char_length("name") BETWEEN 1 AND 50)`,
    );

    // 4. No repeated positions; checked at the end of each statement so shifts can run in one UPDATE (D19).
    await queryRunner.query(`DROP INDEX "IDX_lists_board_position"`);
    await queryRunner.query(`
      ALTER TABLE "lists"
        ADD CONSTRAINT "UQ_lists_board_position" UNIQUE ("board_id", "position") DEFERRABLE INITIALLY IMMEDIATE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lists" DROP CONSTRAINT "UQ_lists_board_position"`);
    await queryRunner.query(`CREATE INDEX "IDX_lists_board_position" ON "lists" ("board_id", "position")`);

    await queryRunner.query(`ALTER TABLE "lists" DROP CONSTRAINT "CHK_lists_name_length"`);
    await queryRunner.query(`ALTER TABLE "lists" ALTER COLUMN "name" TYPE varchar(100)`);

    await queryRunner.query(`ALTER TABLE "lists" DROP CONSTRAINT "CHK_lists_position"`);
    await queryRunner.query(`UPDATE "lists" SET "position" = "position" - 1`);
    await queryRunner.query(`ALTER TABLE "lists" ADD CONSTRAINT "CHK_lists_position" CHECK ("position" >= 0)`);
  }
}
