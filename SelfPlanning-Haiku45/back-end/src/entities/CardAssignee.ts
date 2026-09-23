import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("card_assignees")
@Unique(["cardId", "userId"])
export class CardAssignee {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @CreateDateColumn()
  dataCriacao!: Date;
}
