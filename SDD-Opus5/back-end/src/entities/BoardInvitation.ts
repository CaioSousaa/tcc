import { Column, CreateDateColumn, Entity, PrimaryColumn, Unique } from "typeorm";

@Entity({ name: "board_invitations" })
@Unique("UQ_board_invitations_board_email", ["boardId", "email"])
export class BoardInvitation {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  /** Normalized e-mail; linked to an account only when accepted (D33). */
  @Column({ type: "varchar", length: 254 })
  email!: string;

  @Column({ type: "varchar", length: 16 })
  role!: string;

  @Column({ name: "invited_by", type: "uuid" })
  invitedBy!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
