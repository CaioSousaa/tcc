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
import { Board } from "./Board";
import { User } from "./User";

export const BOARD_MEMBER_ROLES = ["admin", "member"] as const;
export type BoardMemberRole = (typeof BOARD_MEMBER_ROLES)[number];

@Entity("board_members")
@Unique(["boardId", "userId"])
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Index()
  @Column({ type: "uuid", name: "board_id" })
  boardId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Index()
  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", length: 20, default: "member" })
  role!: BoardMemberRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
