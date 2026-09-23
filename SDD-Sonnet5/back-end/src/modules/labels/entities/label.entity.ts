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
import { Board } from "../../boards/entities/board.entity";

export const LABEL_COLORS = [
  "verde",
  "amarelo",
  "laranja",
  "vermelho",
  "roxo",
  "azul",
  "ciano",
  "cinza",
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

@Entity("labels")
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Column({ type: "varchar", length: 50 })
  name!: string;

  @Column({ type: "varchar", length: 20 })
  color!: LabelColor;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
