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
import { User } from "./User";

export const BOARD_COLORS = ["navy", "blue", "green", "gold", "purple"] as const;
export type BoardColor = (typeof BOARD_COLORS)[number];

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  title!: string;

  @Column({ type: "varchar", length: 20, default: "navy" })
  color!: BoardColor;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @Index()
  @Column({ type: "uuid", name: "owner_id" })
  ownerId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
