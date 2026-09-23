import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { List } from "./List";
import { CardLabel } from "./CardLabel";
import { Comment } from "./Comment";

export enum PrazoStatus {
  PENDENTE = "pendente",
  PROXIMO = "proximo",
  ATRASADO = "atrasado",
}

@Entity("cards")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  listaId!: string;

  @ManyToOne(() => List, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listaId" })
  lista!: List;

  @Column({ length: 100 })
  titulo!: string;

  @Column({ nullable: true, type: "text" })
  descricao?: string;

  @Column()
  ordem!: number;

  @Column({ nullable: true, type: "timestamp" })
  dataPrazo?: Date;

  @CreateDateColumn()
  dataCriacao!: Date;

  @UpdateDateColumn()
  dataAtualizacao!: Date;

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.card, { onDelete: "CASCADE" })
  cardLabels!: CardLabel[];

  @OneToMany(() => Comment, (comment) => comment.card, { onDelete: "CASCADE" })
  comments!: Comment[];

  getStatusPrazo(): PrazoStatus | null {
    if (!this.dataPrazo) return null;

    const agora = new Date();
    const prazo = new Date(this.dataPrazo);
    const diffMs = prazo.getTime() - agora.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return PrazoStatus.ATRASADO;
    if (diffDias === 0) return PrazoStatus.PROXIMO;
    return PrazoStatus.PENDENTE;
  }
}
