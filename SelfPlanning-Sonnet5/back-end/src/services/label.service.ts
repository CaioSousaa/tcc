import { AppDataSource } from "../config/data-source";
import { Label, LabelColor } from "../entities/Label";
import { CardLabel } from "../entities/CardLabel";
import { getBoard } from "./board.service";

const labelRepository = () => AppDataSource.getRepository(Label);
const cardLabelRepository = () => AppDataSource.getRepository(CardLabel);

export class LabelNotFoundError extends Error {}

async function ensureBoardOwnership(ownerId: string, boardId: string): Promise<void> {
  await getBoard(ownerId, boardId);
}

async function findLabelOrThrow(boardId: string, labelId: string): Promise<Label> {
  const label = await labelRepository().findOne({ where: { id: labelId, boardId } });
  if (!label) {
    throw new LabelNotFoundError();
  }
  return label;
}

export async function createLabel(
  ownerId: string,
  boardId: string,
  name: string,
  color: LabelColor
): Promise<Label> {
  await ensureBoardOwnership(ownerId, boardId);
  const label = labelRepository().create({ boardId, name, color });
  return labelRepository().save(label);
}

export interface LabelWithCount extends Label {
  cardCount: number;
}

export async function listLabels(
  ownerId: string,
  boardId: string
): Promise<LabelWithCount[]> {
  await ensureBoardOwnership(ownerId, boardId);

  const labels = await labelRepository().find({
    where: { boardId },
    order: { createdAt: "ASC" },
  });

  const withCounts = await Promise.all(
    labels.map(async (label) => {
      const cardCount = await cardLabelRepository().count({ where: { labelId: label.id } });
      return Object.assign(label, { cardCount });
    })
  );

  return withCounts;
}

export async function getLabelInBoard(boardId: string, labelId: string): Promise<Label> {
  return findLabelOrThrow(boardId, labelId);
}

export async function updateLabel(
  ownerId: string,
  boardId: string,
  labelId: string,
  changes: { name?: string; color?: LabelColor }
): Promise<Label> {
  await ensureBoardOwnership(ownerId, boardId);
  const label = await findLabelOrThrow(boardId, labelId);

  if (changes.name !== undefined) label.name = changes.name;
  if (changes.color !== undefined) label.color = changes.color;

  return labelRepository().save(label);
}

export async function deleteLabel(
  ownerId: string,
  boardId: string,
  labelId: string
): Promise<void> {
  await ensureBoardOwnership(ownerId, boardId);
  const label = await findLabelOrThrow(boardId, labelId);
  await labelRepository().remove(label);
}
