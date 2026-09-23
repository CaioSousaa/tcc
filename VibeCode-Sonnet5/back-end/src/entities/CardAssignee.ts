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
import { User } from "./User";

@Entity("card_assignees")
@Unique(["cardId", "userId"])
export class CardAssignee {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Index()
  @Column({ type: "uuid", name: "card_id" })
  cardId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Index()
  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
