import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "card_labels" })
@Index("IDX_card_labels_label", ["labelId"])
export class CardLabel {
  @PrimaryColumn({ name: "card_id", type: "uuid" })
  cardId!: string;

  @PrimaryColumn({ name: "label_id", type: "uuid" })
  labelId!: string;

  /** Written from the card's own board, never from the client (D38, C189). */
  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
