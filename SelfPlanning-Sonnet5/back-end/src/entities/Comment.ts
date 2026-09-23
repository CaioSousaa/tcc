import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  text!: string;

  @Column({ name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Column({ name: "author_id" })
  authorId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "author_id" })
  author!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
