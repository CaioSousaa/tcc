import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from "typeorm";
import { Card } from "./Card";
import { Label } from "./Label";

@Entity("card_labels")
@Index("idx_card_labels_card_id", ["card_id"])
@Index("idx_card_labels_label_id", ["label_id"])
@Unique("uq_card_labels_card_label", ["card_id", "label_id"])
export class CardLabel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  card_id!: string;

  @Column({ type: "uuid" })
  label_id!: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @ManyToOne(() => Label, (label) => label.cardLabels, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "label_id" })
  label!: Label;
}
