import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Board } from "./Board";
import { User } from "./User";

export const BOARD_ROLES = ["admin", "member"] as const;
export type BoardRole = (typeof BOARD_ROLES)[number];

@Entity("board_members")
@Unique(["boardId", "userId"])
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", default: "member" })
  role!: BoardRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
