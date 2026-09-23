import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Board } from "./Board";

@Entity("lists")
export class List {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  quadroId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "quadroId" })
  quadro!: Board;

  @Column({ length: 50 })
  titulo!: string;

  @Column()
  ordem!: number;

  @CreateDateColumn()
  dataCriacao!: Date;

  @UpdateDateColumn()
  dataAtualizacao!: Date;
}
