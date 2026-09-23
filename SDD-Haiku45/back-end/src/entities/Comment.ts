import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("comments")
@Index("idx_comments_card_id", ["card_id"])
@Index("idx_comments_user_id", ["user_id"])
@Index("idx_comments_created_at", ["created_at"])
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  card_id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @Column({ type: "varchar", length: 1000 })
  content!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: "timestamp", nullable: true })
  edited_at!: Date | null;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;
}
