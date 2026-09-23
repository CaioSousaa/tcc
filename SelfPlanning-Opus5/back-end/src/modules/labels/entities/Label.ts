import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Board } from "../../boards/entities/Board";
import { LabelColor } from "../labelColors";
import { CardLabel } from "./CardLabel";

@Entity("labels")
@Index("labels_board_name_unique", ["boardId", "name"], { unique: true })
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 60 })
  name!: string;

  @Column({ type: "varchar", length: 20 })
  color!: LabelColor;

  @Column({ type: "uuid", name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, (board) => board.labels, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.label)
  cardLinks!: CardLabel[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
