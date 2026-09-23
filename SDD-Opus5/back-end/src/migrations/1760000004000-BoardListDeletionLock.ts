import type { MigrationInterface, QueryRunner } from "typeorm";

export class BoardListDeletionLock1760000004000 implements MigrationInterface {
  name = "BoardListDeletionLock1760000004000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Existing and new boards start unlocked (RF05 RN03).
    await queryRunner.query(`ALTER TABLE "boards" ADD COLUMN "lock_list_deletion" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "lock_list_deletion"`);
  }
}
