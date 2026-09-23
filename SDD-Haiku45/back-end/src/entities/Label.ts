import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from "typeorm";
import { Board } from "./Board";
import { CardLabel } from "./CardLabel";

@Entity("labels")
@Index("idx_labels_board_id", ["board_id"])
@Unique("uq_labels_board_name", ["board_id", "name"])
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  board_id!: string;

  @Column({ type: "varchar", length: 50 })
  name!: string;

  @Column({ type: "varchar", length: 7 })
  color!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.label)
  cardLabels!: CardLabel[];
}
