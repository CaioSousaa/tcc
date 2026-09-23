import {
  Entity,
  PrimaryGeneratedColumn,
  Column as ColumnDecorator,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from "typeorm";
import { Board } from "./Board";

@Entity("columns")
@Unique("uq_columns_board_id_name", ["board_id", "name"])
@Index("idx_columns_board_id", ["board_id"])
@Index("idx_columns_board_id_position", ["board_id", "position"])
export class BoardColumn {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ColumnDecorator({ type: "uuid" })
  board_id!: string;

  @ColumnDecorator({ type: "varchar", length: 100 })
  name!: string;

  @ColumnDecorator({ type: "int" })
  position!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Board, (board) => board.columns, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;
}
