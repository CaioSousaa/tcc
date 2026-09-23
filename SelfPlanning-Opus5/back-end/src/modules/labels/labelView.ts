import { Label } from "./entities/Label";
import { LabelColor } from "./labelColors";

export interface LabelView {
  id: string;
  name: string;
  color: LabelColor;
  boardId: string;
}

export interface LabelWithCountView extends LabelView {
  cardCount: number;
}

export function toLabelView(label: Label): LabelView {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
    boardId: label.boardId,
  };
}
