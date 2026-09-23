import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Card } from "../../cards/entities/Card";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "boolean", default: false })
  done!: boolean;

  /** Posição do item dentro do checklist, começando em zero e sempre contígua. */
  @Column({ type: "int" })
  position!: number;

  @Column({ type: "uuid", name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Card, (card) => card.checklistItems, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
