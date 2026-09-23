import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from "typeorm";
import { Card } from "./Card";
import { Label } from "./Label";

@Entity()
@Unique(["cardId", "labelId"])
export class CardLabel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  cardId!: string;

  @Column()
  labelId!: string;

  @ManyToOne(() => Card, (card) => card.cardLabels, { onDelete: "CASCADE" })
  card!: Card;

  @ManyToOne(() => Label, (label) => label.cardLabels, { onDelete: "CASCADE" })
  label!: Label;
}
