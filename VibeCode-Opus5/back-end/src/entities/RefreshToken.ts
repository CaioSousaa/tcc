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

  /** SHA-256 hash of the opaque token handed to the client. */
  @Index("idx_refresh_tokens_token_hash", { unique: true })
  @Column({ type: "varchar", length: 64, name: "token_hash", unique: true })
  tokenHash!: string;

  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "timestamptz", name: "expires_at" })
  expiresAt!: Date;

  /** Whether the user asked to stay signed in on this device ("manter-me conectado"). */
  @Column({ type: "boolean", default: true })
  persistent!: boolean;

  @Column({ type: "timestamptz", name: "revoked_at", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;
}
