import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLabels1760000007000 implements MigrationInterface {
  name = "CreateLabels1760000007000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "labels" (
        "id" uuid NOT NULL,
        "board_id" uuid NOT NULL,
        "name" varchar(30) NOT NULL,
        "color" varchar(16) NOT NULL,
        -- clock_timestamp(): distinct values even inside one transaction (RF08 D39).
        "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_labels_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_labels_board" FOREIGN KEY ("board_id") REFERENCES "boards" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_labels_name_length" CHECK (char_length("name") BETWEEN 1 AND 30),
        CONSTRAINT "CHK_labels_color" CHECK ("color" IN ('red', 'blue', 'green', 'amber', 'purple', 'gray')),
        CONSTRAINT "UQ_labels_id_board" UNIQUE ("id", "board_id")
      )
    `);
    // Case-insensitive unique name per board, accents preserved (RN04, F104).
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_labels_board_name_ci" ON "labels" ("board_id", lower("name"))`);
    await queryRunner.query(`CREATE INDEX "IDX_labels_board_order" ON "labels" ("board_id", "created_at", "id")`);

    await queryRunner.query(`
      CREATE TABLE "card_labels" (
        "card_id" uuid NOT NULL,
        "label_id" uuid NOT NULL,
        "board_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_card_labels" PRIMARY KEY ("card_id", "label_id"),
        CONSTRAINT "FK_card_labels_card" FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE,
        -- Same board as the label; deleting the label removes its applications (F99, F100, D38).
        CONSTRAINT "FK_card_labels_label" FOREIGN KEY ("label_id", "board_id")
          REFERENCES "labels" ("id", "board_id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_card_labels_label" ON "card_labels" ("label_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "card_labels"`);
    await queryRunner.query(`DROP TABLE "labels"`);
  }
}
