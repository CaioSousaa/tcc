import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Board } from "./Board";

export const LABEL_COLORS = ["red", "blue", "green", "amber", "purple", "gray"] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

@Entity("labels")
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "varchar", default: "gray" })
  color!: LabelColor;

  @Column({ name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
