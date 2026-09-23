import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Board } from "./Board";
import { User } from "./User";

export enum BoardRole {
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
}

@Entity("board_members")
export class BoardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Board, (board) => board.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @Column()
  boardId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: string;

  @Column({ type: "enum", enum: BoardRole, default: BoardRole.EDITOR })
  role!: BoardRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
