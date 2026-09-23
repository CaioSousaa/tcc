import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Card } from "./card.entity";
import { User } from "../../auth/entities/user.entity";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Column({ name: "author_id" })
  authorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "author_id" })
  author!: User;

  @Column({ type: "varchar", length: 2000 })
  text!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
