import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Column({ name: "label_id" })
  labelId!: string;

  @ManyToOne(() => Label, { onDelete: "CASCADE" })
  @JoinColumn({ name: "label_id" })
  label!: Label;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
