import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Board } from "./Board";
import { User } from "./User";

export const BOARD_MEMBER_ROLES = ["admin", "member"] as const;
export type BoardMemberRole = (typeof BOARD_MEMBER_ROLES)[number];

export const BOARD_MEMBER_STATUSES = ["active", "pending"] as const;
export type BoardMemberStatus = (typeof BOARD_MEMBER_STATUSES)[number];

@Entity("board_members")
@Index("idx_board_members_board_id_email", ["boardId", "email"], {
  unique: true,
})
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  /** Null until the invited e-mail matches a registered user. */
  @Column({ type: "uuid", name: "user_id", nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  /** The invited e-mail, kept even after it links to a user. */
  @Column({ type: "varchar", length: 180 })
  email!: string;

  @Column({ type: "varchar", length: 20, default: "member" })
  role!: BoardMemberRole;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: BoardMemberStatus;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}
