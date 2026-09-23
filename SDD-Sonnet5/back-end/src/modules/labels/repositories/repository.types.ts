import { Label, LabelColor } from "../entities/label.entity";

export interface CreateLabelData {
  boardId: string;
  name: string;
  color: LabelColor;
}

export interface UpdateLabelData {
  name?: string;
  color?: LabelColor;
}

export interface LabelRepository {
  create(data: CreateLabelData): Promise<Label>;
  findAllByBoard(boardId: string): Promise<Label[]>;
  findByIdAndBoard(id: string, boardId: string): Promise<Label | null>;
  update(id: string, boardId: string, data: UpdateLabelData): Promise<Label | null>;
  delete(id: string, boardId: string): Promise<boolean>;
}
