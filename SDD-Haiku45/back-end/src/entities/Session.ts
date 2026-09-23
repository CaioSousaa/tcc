import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { User } from "./User";

@Entity("sessions")
@Index("idx_sessions_user_id", ["user_id"])
@Index("idx_sessions_expires_at", ["expires_at"])
export class Session {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: "timestamp" })
  last_activity_at!: Date;

  @Column({ type: "timestamp" })
  expires_at!: Date;

  @Column({ type: "enum", enum: ["active", "invalidated"], default: "active" })
  status!: "active" | "invalidated";
}
