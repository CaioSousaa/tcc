import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { List } from "./List";
import { ChecklistItem } from "./ChecklistItem";
import { CardAssignee } from "./CardAssignee";
import { Label } from "./Label";
import { Comment } from "./Comment";

@Entity("cards")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 0 })
  position!: number;

  @Column({ type: "timestamp", nullable: true, default: null })
  dueDate!: Date | null;

  @ManyToOne(() => List, (list) => list.cards, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listId" })
  list!: List;

  @Column()
  listId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => ChecklistItem, (item) => item.card, { cascade: true })
  checklistItems!: ChecklistItem[];

  @OneToMany(() => CardAssignee, (assignee) => assignee.card, { cascade: true })
  assignees!: CardAssignee[];

  @ManyToMany(() => Label, (label) => label.cards)
  @JoinTable({ name: "card_labels" })
  labels!: Label[];

  @OneToMany(() => Comment, (comment) => comment.card, { cascade: true })
  comments!: Comment[];
}
