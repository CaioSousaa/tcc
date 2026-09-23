import { Column, CreateDateColumn, Entity, PrimaryColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity({ name: "checklist_items" })
@Unique("UQ_checklist_items_card_position", ["cardId", "position"])
export class ChecklistItem {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ name: "card_id", type: "uuid" })
  cardId!: string;

  @Column({ type: "varchar", length: 200 })
  text!: string;

  @Column({ type: "boolean", default: false })
  done!: boolean;

  @Column({ type: "integer" })
  position!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
