import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Card } from "./Card";

@Entity("checklist_items")
export class ChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @Column({ length: 200 })
  titulo!: string;

  @Column({ default: false })
  concluido!: boolean;

  @Column()
  ordem!: number;

  @CreateDateColumn()
  dataCriacao!: Date;
}
