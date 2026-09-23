import { List } from "../entities/list.entity";

export interface CreateListData {
  boardId: string;
  name: string;
}

export interface UpdateListData {
  name?: string;
  position?: number;
}

export interface ListRepository {
  create(data: CreateListData): Promise<List>;
  findAllByBoard(boardId: string): Promise<List[]>;
  findByIdAndBoard(id: string, boardId: string): Promise<List | null>;
  countByBoard(boardId: string): Promise<number>;
  update(id: string, boardId: string, data: UpdateListData): Promise<List | null>;
  delete(id: string, boardId: string): Promise<boolean>;
}
