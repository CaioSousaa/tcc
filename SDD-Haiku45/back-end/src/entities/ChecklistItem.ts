import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Checklist } from "./Checklist";

@Entity("checklist_items")
@Index("idx_checklist_items_checklist_id", ["checklist_id"])
@Index("idx_checklist_items_position", ["checklist_id", "position"])
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  checklist_id!: string;

  @Column({ type: "varchar", length: 500 })
  title!: string;

  @Column({ type: "boolean", default: false })
  is_completed!: boolean;

  @Column({ type: "int" })
  position!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Checklist, (checklist) => checklist.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "checklist_id" })
  checklist!: Checklist;
}
