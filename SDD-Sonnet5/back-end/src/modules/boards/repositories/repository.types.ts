import { Board } from "../entities/board.entity";

export interface CreateBoardData {
  ownerId: string;
  name: string;
  description?: string;
}

export interface UpdateBoardData {
  name?: string;
  description?: string | null;
}

export interface BoardRepository {
  create(data: CreateBoardData): Promise<Board>;
  findAllByMember(userId: string): Promise<Board[]>;
  findByIdAndMember(id: string, userId: string): Promise<Board | null>;
  updateByIdAndMember(id: string, userId: string, data: UpdateBoardData): Promise<Board | null>;
  deleteById(id: string): Promise<boolean>;
}
