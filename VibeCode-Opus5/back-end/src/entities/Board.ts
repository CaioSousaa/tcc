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
import { List } from "./List";
import { User } from "./User";

export const BOARD_COLORS = [
  "navy",
  "blue",
  "green",
  "amber",
  "purple",
] as const;

export type BoardColor = (typeof BOARD_COLORS)[number];

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  title!: string;

  @Column({ type: "varchar", length: 20, default: "navy" })
  color!: BoardColor;

  @Index("idx_boards_owner_id")
  @Column({ type: "uuid", name: "owner_id" })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.boards, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @OneToMany(() => List, (list) => list.board)
  lists!: List[];

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}
