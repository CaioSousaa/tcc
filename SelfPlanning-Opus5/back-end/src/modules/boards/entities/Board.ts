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
import { User } from "../../users/entities/User";
import { BoardList } from "../../lists/entities/BoardList";
import { BoardMember } from "../../members/entities/BoardMember";
import { Label } from "../../labels/entities/Label";
import { BoardColor, DEFAULT_BOARD_COLOR } from "../boardColors";

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "varchar", length: 20, default: DEFAULT_BOARD_COLOR })
  color!: BoardColor;

  /** Quando ligada, impede excluir uma lista do quadro que ainda tenha cards. */
  @Column({ type: "boolean", name: "block_list_deletion_with_cards", default: false })
  blockListDeletionWithCards!: boolean;

  @Column({ type: "uuid", name: "owner_id" })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.boards, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @OneToMany(() => BoardList, (list) => list.board)
  lists!: BoardList[];

  @OneToMany(() => BoardMember, (member) => member.board)
  members!: BoardMember[];

  @OneToMany(() => Label, (label) => label.board)
  labels!: Label[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
