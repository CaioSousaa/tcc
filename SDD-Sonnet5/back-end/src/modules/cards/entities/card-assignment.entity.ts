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
import { Card } from "./card.entity";
import { User } from "../../auth/entities/user.entity";

@Entity("card_assignments")
@Unique(["cardId", "userId"])
@Index(["boardId", "userId"])
export class CardAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  /** Denormalizado a partir do quadro do card, no momento da atribuição (RF07 plano §3.2). */
  @Column({ name: "board_id" })
  boardId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
