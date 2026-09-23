import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BoardList } from "../../lists/entities/BoardList";
import { ChecklistItem } from "../../checklists/entities/ChecklistItem";
import { CardAssignee } from "../../members/entities/CardAssignee";
import { CardLabel } from "../../labels/entities/CardLabel";
import { Comment } from "../../comments/entities/Comment";

@Entity("cards")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  /** Prazo do card no formato YYYY-MM-DD, sem hora. */
  @Column({ type: "date", name: "due_date", nullable: true })
  dueDate!: string | null;

  /** Posição do card dentro da lista, começando em zero e sempre contígua. */
  @Column({ type: "int" })
  position!: number;

  @Column({ type: "uuid", name: "list_id" })
  listId!: string;

  @ManyToOne(() => BoardList, (list) => list.cards, { onDelete: "CASCADE" })
  @JoinColumn({ name: "list_id" })
  list!: BoardList;

  @OneToMany(() => ChecklistItem, (item) => item.card)
  checklistItems!: ChecklistItem[];

  @OneToMany(() => CardAssignee, (assignee) => assignee.card)
  assignees!: CardAssignee[];

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.card)
  labels!: CardLabel[];

  @OneToMany(() => Comment, (comment) => comment.card)
  comments!: Comment[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
