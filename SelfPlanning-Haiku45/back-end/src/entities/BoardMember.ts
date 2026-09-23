import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Board } from "./Board";
import { User } from "./User";

export type MemberRole = "owner" | "editor" | "viewer" | "assignee";

@Entity("board_members")
@Unique(["boardId", "userId"])
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "enum", enum: ["owner", "editor", "viewer", "assignee"], default: "viewer" })
  role!: MemberRole;

  @CreateDateColumn()
  dataCriacao!: Date;
}
