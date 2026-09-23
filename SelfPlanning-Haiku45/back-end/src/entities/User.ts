import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  nome!: string;

  @Column()
  senha!: string;

  @CreateDateColumn()
  dataInclusao!: Date;
}
