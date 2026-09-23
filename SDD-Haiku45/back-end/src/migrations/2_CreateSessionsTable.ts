import { MigrationInterface, QueryRunner, Table, Index } from "typeorm";

export class CreateSessionsTable1000000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "sessions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "user_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            isNullable: false,
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "last_activity_at",
            type: "timestamp",
            isNullable: false,
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "expires_at",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "status",
            type: "enum",
            enum: ["active", "invalidated"],
            default: "'active'",
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ["user_id"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
        ],
        indices: [
          {
            columnNames: ["user_id"],
            name: "idx_sessions_user_id",
          },
          {
            columnNames: ["expires_at"],
            name: "idx_sessions_expires_at",
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("sessions");
  }
}
