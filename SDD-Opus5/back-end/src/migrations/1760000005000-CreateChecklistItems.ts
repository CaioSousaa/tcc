import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChecklistItems1760000005000 implements MigrationInterface {
  name = "CreateChecklistItems1760000005000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "checklist_items" (
        "id" uuid NOT NULL,
        "card_id" uuid NOT NULL,
        "text" varchar(200) NOT NULL,
        "done" boolean NOT NULL DEFAULT false,
        "position" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_checklist_items_id" PRIMARY KEY ("id"),
        -- Items go with their card (RF02 D9, RF06 F67).
        CONSTRAINT "FK_checklist_items_card" FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_checklist_items_text_length" CHECK (char_length("text") BETWEEN 1 AND 200),
        CONSTRAINT "CHK_checklist_items_position" CHECK ("position" >= 1),
        CONSTRAINT "UQ_checklist_items_card_position" UNIQUE ("card_id", "position")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "checklist_items"`);
  }
}
