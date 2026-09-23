import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillBoardOwnersAsAdmins1789900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO board_members (board_id, user_id, role, status, accepted_at)
      SELECT b.id, b.user_id, 'admin', 'active', now()
      FROM boards b
      WHERE NOT EXISTS (
        SELECT 1 FROM board_members m
        WHERE m.board_id = b.id AND m.user_id = b.user_id
      )
    `);
  }

  public async down(): Promise<void> {
    // Dados inseridos não podem ser distinguidos de membros criados manualmente.
  }
}
