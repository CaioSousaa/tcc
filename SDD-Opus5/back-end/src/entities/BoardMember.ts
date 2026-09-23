import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "board_members" })
@Index("IDX_board_members_user", ["userId", "boardId"])
export class BoardMember {
  @PrimaryColumn({ name: "board_id", type: "uuid" })
  boardId!: string;

  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", length: 16 })
  role!: string;

  @Column({ name: "joined_at", type: "timestamptz", default: () => "now()" })
  joinedAt!: Date;
}
