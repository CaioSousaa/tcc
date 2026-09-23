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
import { List } from "./List";

@Entity("cards")
@Index("idx_cards_list_id_position", ["listId", "position"])
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  /** Calendar day the card is due, stored without a time component. */
  @Column({ type: "date", name: "due_date", nullable: true })
  dueDate!: string | null;

  /** Zero-based and contiguous inside a list; the service keeps it compact. */
  @Column({ type: "int" })
  position!: number;

  @Column({ type: "uuid", name: "list_id" })
  listId!: string;

  @ManyToOne(() => List, { onDelete: "CASCADE" })
  @JoinColumn({ name: "list_id" })
  list!: List;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}
