import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "token_hash", unique: true })
  tokenHash!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "expires_at" })
  expiresAt!: Date;

  @Column({ name: "revoked_at", type: "timestamp", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
