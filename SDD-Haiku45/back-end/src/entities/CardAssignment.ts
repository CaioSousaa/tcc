import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from "typeorm";
import { Card } from "./Card";
import { BoardMember } from "./BoardMember";

@Entity("card_assignments")
@Index("idx_card_assignments_card_id", ["card_id"])
@Index("idx_card_assignments_board_member_id", ["board_member_id"])
@Unique("uq_card_assignments_card_member", ["card_id", "board_member_id"])
export class CardAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  card_id!: string;

  @Column({ type: "uuid" })
  board_member_id!: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  assigned_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @ManyToOne(() => BoardMember, (member) => member.assignments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "board_member_id" })
  board_member!: BoardMember;
}
