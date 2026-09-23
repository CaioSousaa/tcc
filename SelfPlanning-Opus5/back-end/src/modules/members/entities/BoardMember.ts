import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Board } from "../../boards/entities/Board";
import { User } from "../../users/entities/User";
import { MemberRole, MemberStatus } from "../memberRoles";
import { CardAssignee } from "./CardAssignee";

@Entity("board_members")
@Index("board_members_board_email_unique", ["boardId", "email"], { unique: true })
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, (board) => board.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  /** Fica nulo enquanto o convite estiver pendente de cadastro. */
  @Column({ type: "uuid", name: "user_id", nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ type: "varchar", length: 180 })
  email!: string;

  @Column({ type: "varchar", length: 20 })
  role!: MemberRole;

  @Column({ type: "varchar", length: 20 })
  status!: MemberStatus;

  @OneToMany(() => CardAssignee, (assignee) => assignee.member)
  assignments!: CardAssignee[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
