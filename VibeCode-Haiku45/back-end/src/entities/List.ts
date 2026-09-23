import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Board } from "./Board";
import { Card } from "./Card";

@Entity("lists")
export class List {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ default: 0 })
  position!: number;

  @ManyToOne(() => Board, (board) => board.lists, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @Column()
  boardId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Card, (card) => card.list, { cascade: true })
  cards!: Card[];
}
