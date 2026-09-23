import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Checklist } from "./checklist.entity";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 500 })
  text!: string;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @Index()
  @Column({ name: "checklist_id" })
  checklistId!: string;

  @ManyToOne(() => Checklist, { onDelete: "CASCADE" })
  @JoinColumn({ name: "checklist_id" })
  checklist!: Checklist;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
