import { BoardMember, BoardMemberRole } from "../entities/board-member.entity";

export interface CreateBoardMemberData {
  boardId: string;
  userId: string;
  role: BoardMemberRole;
}

export interface MemberInfo {
  userId: string;
  name: string;
  email: string;
  role: BoardMemberRole;
}

export interface BoardMemberRepository {
  create(data: CreateBoardMemberData): Promise<BoardMember>;
  findAllByBoard(boardId: string): Promise<BoardMember[]>;
  findAllByBoardWithUser(boardId: string): Promise<MemberInfo[]>;
  findByBoardAndUser(boardId: string, userId: string): Promise<BoardMember | null>;
  findAllByUserId(userId: string): Promise<BoardMember[]>;
  updateRole(boardId: string, userId: string, role: BoardMemberRole): Promise<BoardMember | null>;
  delete(boardId: string, userId: string): Promise<boolean>;
  countAdminsByBoard(boardId: string): Promise<number>;
}
