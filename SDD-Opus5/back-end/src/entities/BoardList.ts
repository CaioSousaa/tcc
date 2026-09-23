import { Column, CreateDateColumn, Entity, PrimaryColumn, Unique, UpdateDateColumn } from "typeorm";

// Positions are contiguous 1..N per board (RF03 RN05); the unique constraint is deferrable in the migration.
@Entity({ name: "lists" })
@Unique("UQ_lists_board_position", ["boardId", "position"])
export class BoardList {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @Column({ type: "varchar", length: 50 })
  name!: string;

  @Column({ type: "integer" })
  position!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
