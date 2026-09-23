import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Card } from "./Card";
import { ChecklistItem } from "./ChecklistItem";

@Entity("checklists")
@Index("idx_checklists_card_id", ["card_id"])
export class Checklist {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true })
  card_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @OneToMany(() => ChecklistItem, (item) => item.checklist, {
    cascade: ["remove"],
  })
  items!: ChecklistItem[];
}
