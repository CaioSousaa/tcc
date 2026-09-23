import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Index("UQ_users_email", { unique: true })
  @Column({ type: "varchar", length: 254 })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255, select: false })
  passwordHash!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
