import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../users/entities/User";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", name: "token_hash", unique: true })
  tokenHash!: string;

  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "timestamp with time zone", name: "expires_at" })
  expiresAt!: Date;

  @Column({ type: "timestamp with time zone", name: "revoked_at", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
