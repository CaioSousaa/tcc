import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
@Index("idx_users_email", { synchronize: false })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  password_hash!: string;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: "timestamp", nullable: true })
  last_login_at: Date | null = null;

  @UpdateDateColumn()
  updated_at!: Date;
}
