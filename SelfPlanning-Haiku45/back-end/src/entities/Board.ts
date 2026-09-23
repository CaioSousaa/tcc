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
import { User } from "./User";
import { Label } from "./Label";

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  usuarioId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "usuarioId" })
  usuario!: User;

  @Column({ length: 100 })
  titulo!: string;

  @Column({ nullable: true })
  descricao?: string;

  @Column({ default: "#3b82f6" })
  corFundo!: string;

  @CreateDateColumn()
  dataCriacao!: Date;

  @UpdateDateColumn()
  dataAtualizacao!: Date;

  @OneToMany(() => Label, (label) => label.board, { onDelete: "CASCADE" })
  labels!: Label[];
}
