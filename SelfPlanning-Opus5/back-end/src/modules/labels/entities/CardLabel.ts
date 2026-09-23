import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Card } from "../../cards/entities/Card";
import { Label } from "./Label";

@Entity("card_labels")
@Index("card_labels_card_label_unique", ["cardId", "labelId"], { unique: true })
export class CardLabel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Card, (card) => card.labels, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Column({ type: "uuid", name: "label_id" })
  labelId!: string;

  @ManyToOne(() => Label, (label) => label.cardLinks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "label_id" })
  label!: Label;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
