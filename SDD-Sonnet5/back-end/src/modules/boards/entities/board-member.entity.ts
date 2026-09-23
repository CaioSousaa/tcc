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
import { Board } from "./board.entity";
import { User } from "../../auth/entities/user.entity";

export type BoardMemberRole = "administrador" | "membro";

@Entity("board_members")
@Unique(["boardId", "userId"])
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "board_id" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;

  @Index()
  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 20 })
  role!: BoardMemberRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
