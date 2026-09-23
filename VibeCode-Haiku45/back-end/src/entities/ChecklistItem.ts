import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Card } from "./Card";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ default: false })
  completed!: boolean;

  @Column({ default: 0 })
  position!: number;

  @ManyToOne(() => Card, (card) => card.checklistItems, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @Column()
  cardId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
