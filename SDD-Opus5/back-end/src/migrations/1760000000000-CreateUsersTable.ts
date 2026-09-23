import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1760000000000 implements MigrationInterface {
  name = "CreateUsersTable1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "email" varchar(254) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email" ON "users" ("email")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
