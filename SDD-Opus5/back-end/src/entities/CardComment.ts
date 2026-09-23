import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "card_comments" })
@Index("IDX_card_comments_card_order", ["cardId", "createdAt", "id"])
export class CardComment {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ name: "card_id", type: "uuid" })
  cardId!: string;

  /** Always the session account (RF09 RN02). */
  @Column({ name: "author_id", type: "uuid" })
  authorId!: string;

  @Column({ type: "varchar", length: 2000 })
  body!: string;

  @Column({ name: "created_at", type: "timestamptz", default: () => "clock_timestamp()" })
  createdAt!: Date;

  /** Set only when the text changes; never cleared (D44). */
  @Column({ name: "edited_at", type: "timestamptz", nullable: true })
  editedAt!: Date | null;
}
