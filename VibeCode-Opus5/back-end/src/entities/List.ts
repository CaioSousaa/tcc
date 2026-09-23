import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Board } from "./Board";

@Entity("lists")
@Index("idx_lists_board_id_position", ["boardId", "position"])
export class List {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  title!: string;

  /** Zero-based and contiguous inside a board; the service keeps it compact. */
  @Column({ type: "int" })
  position!: number;

  @Column({ type: "uuid", name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, (board) => board.lists, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}
