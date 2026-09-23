import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Board } from "./Board";
import { CardLabel } from "./CardLabel";

@Entity()
export class Label {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  boardId!: string;

  @Column()
  nome!: string;

  @Column()
  cor!: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  dataCriacao!: Date;

  @ManyToOne(() => Board, (board) => board.labels, { onDelete: "CASCADE" })
  board!: Board;

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.label, { onDelete: "CASCADE" })
  cardLabels!: CardLabel[];
}
