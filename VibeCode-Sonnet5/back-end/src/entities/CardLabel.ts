import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Card } from "./Card";
import { Label } from "./Label";

@Entity("card_labels")
@Unique(["cardId", "labelId"])
export class CardLabel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Index()
  @Column({ type: "uuid", name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Label, { onDelete: "CASCADE" })
  @JoinColumn({ name: "label_id" })
  label!: Label;

  @Index()
  @Column({ type: "uuid", name: "label_id" })
  labelId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
