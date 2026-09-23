import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  cardId!: string;

  @Column()
  usuarioId!: string;

  @Column({ type: "text" })
  texto!: string;

  @CreateDateColumn()
  dataCriacao!: Date;

  @UpdateDateColumn()
  dataAtualizacao!: Date;

  @ManyToOne(() => Card, (card) => card.comments, { onDelete: "CASCADE" })
  card!: Card;

  @ManyToOne(() => User)
  usuario!: User;
}
