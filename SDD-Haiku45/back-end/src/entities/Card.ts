import {
  Entity,
  PrimaryGeneratedColumn,
  Column as ColumnDecorator,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { BoardColumn } from "./Column";

@Entity("cards")
@Index("idx_cards_list_id", ["list_id"])
@Index("idx_cards_list_id_position", ["list_id", "position"])
@Index("idx_cards_due_date", ["due_date"])
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ColumnDecorator({ type: "uuid" })
  list_id!: string;

  @ColumnDecorator({ type: "varchar", length: 255 })
  title!: string;

  @ColumnDecorator({ type: "varchar", length: 5000, nullable: true })
  description!: string | null;

  @ColumnDecorator({ type: "int" })
  position!: number;

  @ColumnDecorator({ type: "date", nullable: true })
  due_date!: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => BoardColumn, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "list_id" })
  list!: BoardColumn;
}
