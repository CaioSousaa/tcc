import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity({ name: "labels" })
@Unique("UQ_labels_id_board", ["id", "boardId"])
@Index("IDX_labels_board_order", ["boardId", "createdAt", "id"])
export class Label {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @Column({ type: "varchar", length: 30 })
  name!: string;

  /** Stable key of the palette, never a hex code (D37). */
  @Column({ type: "varchar", length: 16 })
  color!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
