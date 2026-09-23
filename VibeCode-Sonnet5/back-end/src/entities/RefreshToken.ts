import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", name: "token_hash" })
  tokenHash!: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "boolean", name: "remember_me", default: false })
  rememberMe!: boolean;

  @Column({ type: "timestamptz", name: "expires_at" })
  expiresAt!: Date;

  @Column({ type: "timestamptz", name: "revoked_at", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
