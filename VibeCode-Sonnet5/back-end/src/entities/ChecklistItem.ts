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
import { Card } from "./Card";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 240 })
  text!: string;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @Column({ type: "int" })
  position!: number;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Index()
  @Column({ type: "uuid", name: "card_id" })
  cardId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
