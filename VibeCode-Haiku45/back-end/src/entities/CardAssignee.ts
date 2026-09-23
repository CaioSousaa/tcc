import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("card_assignees")
export class CardAssignee {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Card, (card) => card.assignees, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @Column()
  cardId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
