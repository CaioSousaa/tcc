import { Column, CreateDateColumn, Entity, PrimaryColumn, Unique, UpdateDateColumn } from "typeorm";

// Positions are contiguous 1..N per list (RF04 RN06); the unique constraint is deferrable in the migration.
@Entity({ name: "cards" })
@Unique("UQ_cards_list_position", ["listId", "position"])
export class Card {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ name: "list_id", type: "uuid" })
  listId!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "integer" })
  position!: number;

  /** Always read as `YYYY-MM-DD` text in SQL, never as a local Date (RF10 D49). */
  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
