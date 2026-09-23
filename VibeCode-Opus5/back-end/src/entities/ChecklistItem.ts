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
@Index("idx_checklist_items_card_id_position", ["cardId", "position"])
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "boolean", default: false })
  done!: boolean;

  /** Zero-based and contiguous inside a card; the service keeps it compact. */
  @Column({ type: "int" })
  position!: number;

  @Column({ type: "uuid", name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}
