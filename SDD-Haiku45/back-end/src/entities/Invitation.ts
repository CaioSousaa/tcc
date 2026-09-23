import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from "typeorm";
import { Board } from "./Board";

@Entity("invitations")
@Index("idx_invitations_board_id", ["board_id"])
@Index("idx_invitations_token", ["token"])
@Index("idx_invitations_email", ["email"])
@Index("idx_invitations_expires_at", ["expires_at"])
@Unique("uq_invitations_board_email", ["board_id", "email"])
@Unique("uq_invitations_token", ["token"])
export class Invitation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  board_id!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 50, default: "viewer" })
  role!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  token!: string;

  @Column({ type: "timestamp" })
  expires_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: "timestamp", nullable: true })
  accepted_at!: Date | null;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "board_id" })
  board!: Board;
}
