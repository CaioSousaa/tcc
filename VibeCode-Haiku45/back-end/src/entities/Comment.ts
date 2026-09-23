import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  content!: string;

  @ManyToOne(() => Card, (card) => card.comments, { onDelete: "CASCADE" })
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
