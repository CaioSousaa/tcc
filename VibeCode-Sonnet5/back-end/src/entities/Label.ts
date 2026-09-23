import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Board } from "./Board";

export const LABEL_COLORS = [
  "red",
  "blue",
  "green",
  "gold",
  "purple",
  "gray",
] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

@Entity("labels")
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 60 })
  name!: string;

  @Column({ type: "varchar", length: 20 })
  color!: LabelColor;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Index()
  @Column({ type: "uuid", name: "board_id" })
  boardId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
