import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { List } from "./List";

@Entity("cards")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column()
  position!: number;

  @Column({ name: "due_date", type: "timestamp", nullable: true })
  dueDate!: Date | null;

  @Column({ name: "list_id" })
  listId!: string;

  @ManyToOne(() => List, { onDelete: "CASCADE" })
  @JoinColumn({ name: "list_id" })
  list!: List;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
