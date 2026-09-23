import type { MigrationInterface, QueryRunner } from "typeorm";

export class CardDueDate1760000009000 implements MigrationInterface {
  name = "CardDueDate1760000009000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Calendar date without time or time zone; existing cards have no due date (RF10 RN01, D48).
    await queryRunner.query(`ALTER TABLE "cards" ADD COLUMN "due_date" date NULL`);
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "CHK_cards_due_date_range"
         CHECK ("due_date" IS NULL OR "due_date" BETWEEN DATE '2000-01-01' AND DATE '2099-12-31')`,
    );
    // Overdue count per board in the listing (RF10 N201).
    await queryRunner.query(
      `CREATE INDEX "IDX_cards_list_due_date" ON "cards" ("list_id", "due_date") WHERE "due_date" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_cards_list_due_date"`);
    await queryRunner.query(`ALTER TABLE "cards" DROP CONSTRAINT "CHK_cards_due_date_range"`);
    await queryRunner.query(`ALTER TABLE "cards" DROP COLUMN "due_date"`);
  }
}
