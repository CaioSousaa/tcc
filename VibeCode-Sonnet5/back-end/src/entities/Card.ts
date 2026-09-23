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
import { List } from "./List";
import { Board } from "./Board";

@Entity("cards")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "timestamptz", name: "due_date", nullable: true })
  dueDate!: Date | null;

  @Column({ type: "int" })
  position!: number;

  @ManyToOne(() => List, { onDelete: "CASCADE" })
  @JoinColumn({ name: "list_id" })
  list!: List;

  @Index()
  @Column({ type: "uuid", name: "list_id" })
  listId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Index()
  @Column({ type: "uuid", name: "board_id" })
  boardId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
