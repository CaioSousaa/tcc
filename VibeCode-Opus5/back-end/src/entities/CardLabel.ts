import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Card } from "./Card";
import { Label } from "./Label";

@Entity("card_labels")
@Index("idx_card_labels_card_id_label_id", ["cardId", "labelId"], {
  unique: true,
})
export class CardLabel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Column({ type: "uuid", name: "label_id" })
  labelId!: string;

  @ManyToOne(() => Label, { onDelete: "CASCADE" })
  @JoinColumn({ name: "label_id" })
  label!: Label;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;
}
