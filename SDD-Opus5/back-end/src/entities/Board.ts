import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "boards" })
@Index("IDX_boards_owner_created", ["ownerId", "createdAt", "id"])
export class Board {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ name: "owner_id", type: "uuid" })
  ownerId!: string;

  @Column({ type: "varchar", length: 60 })
  name!: string;

  @Column({ type: "varchar", length: 16 })
  color!: string;

  @Column({ name: "lock_list_deletion", type: "boolean", default: false })
  lockListDeletion!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
