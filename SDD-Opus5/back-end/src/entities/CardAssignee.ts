import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "card_assignees" })
@Index("IDX_card_assignees_board_user", ["boardId", "userId"])
export class CardAssignee {
  @PrimaryColumn({ name: "card_id", type: "uuid" })
  cardId!: string;

  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  /** Always written from the card's own board, never from the client (D32, C159). */
  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @Column({ name: "assigned_at", type: "timestamptz", default: () => "now()" })
  assignedAt!: Date;
}
