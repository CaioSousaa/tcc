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

export const LABEL_COLORS = [
  "red",
  "blue",
  "green",
  "amber",
  "purple",
  "gray",
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

@Entity("labels")
@Index("idx_labels_board_id_name", ["boardId", "name"], { unique: true })
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 60 })
  name!: string;

  @Column({ type: "varchar", length: 20, default: "blue" })
  color!: LabelColor;

  @Column({ type: "uuid", name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}
