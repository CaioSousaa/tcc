import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";
import { Card } from "../../cards/entities/Card";
import { BoardMember } from "./BoardMember";

@Entity("card_assignees")
@Index("card_assignees_card_member_unique", ["cardId", "memberId"], { unique: true })
export class CardAssignee {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "card_id" })
  cardId!: string;

  @ManyToOne(() => Card, (card) => card.assignees, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @Column({ type: "uuid", name: "member_id" })
  memberId!: string;

  @ManyToOne(() => BoardMember, (member) => member.assignments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "member_id" })
  member!: BoardMember;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
