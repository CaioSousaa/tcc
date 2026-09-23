import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from "typeorm";
import { Board } from "./Board";
import { User } from "./User";
import { CardAssignment } from "./CardAssignment";

export enum MemberRole {
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
}

export enum MemberStatus {
  ACTIVE = "active",
  INVITE_PENDING = "invite_pending",
  REMOVED = "removed",
}

@Entity("board_members")
@Index("idx_board_members_board_id", ["board_id"])
@Index("idx_board_members_user_id", ["user_id"])
@Index("idx_board_members_status", ["status"])
@Unique("uq_board_members_board_user", ["board_id", "user_id"])
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  board_id!: string;

  @Column({ type: "uuid", nullable: true })
  user_id!: string | null;

  @Column({ type: "enum", enum: MemberRole, default: MemberRole.VIEWER })
  role!: MemberRole;

  @Column({ type: "enum", enum: MemberStatus, default: MemberStatus.ACTIVE })
  status!: MemberStatus;

  @Column({ type: "timestamp", nullable: true })
  invited_at!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  accepted_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @OneToMany(() => CardAssignment, (assignment) => assignment.board_member, {
    cascade: true,
  })
  assignments!: CardAssignment[];
}
