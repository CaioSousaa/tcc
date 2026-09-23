import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { List } from "./List";
import { BoardMember } from "./BoardMember";

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: "#3B82F6" })
  color!: string;

  @ManyToOne(() => User, (user) => user.boards, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => List, (list) => list.board, { cascade: true })
  lists!: List[];

  @OneToMany(() => BoardMember, (member) => member.board, { cascade: true })
  members!: BoardMember[];
}
