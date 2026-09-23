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
import { List } from "../../lists/entities/list.entity";

@Entity("cards")
@Index(["listId", "position"])
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "varchar", length: 2000, nullable: true })
  description!: string | null;

  @Column({ name: "list_id" })
  listId!: string;

  @ManyToOne(() => List, { onDelete: "CASCADE" })
  @JoinColumn({ name: "list_id" })
  list!: List;

  @Column({ type: "int" })
  position!: number;

  @Column({ type: "date", name: "due_date", nullable: true })
  dueDate!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
