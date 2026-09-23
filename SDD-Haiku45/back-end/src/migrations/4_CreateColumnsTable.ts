import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateColumnsTable1000000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "columns",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "board_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "name",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "position",
            type: "int",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            isNullable: false,
            default: "CURRENT_TIMESTAMP",
          },
        ],
        foreignKeys: [
          {
            columnNames: ["board_id"],
            referencedTableName: "boards",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
        ],
        indices: [
          {
            columnNames: ["board_id"],
            name: "idx_columns_board_id",
          },
          {
            columnNames: ["board_id", "position"],
            name: "idx_columns_board_id_position",
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("columns");
  }
}
