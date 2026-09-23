import { AppError } from "../../../shared/errors/AppError";
import { requireBoardAccess, requireBoardAdmin } from "../../boards/services/boardService";
import { findOwnedCard } from "../../cards/services/cardService";
import { Label } from "../entities/Label";
import { LabelColor } from "../labelColors";
import { LabelView, LabelWithCountView, toLabelView } from "../labelView";
import { cardLabelRepository, labelRepository } from "../repositories/labelRepository";
import { labelsOfCard } from "./labelGrouping";

export interface CreateLabelRequest {
  boardId: string;
  actorId: string;
  name: string;
  color: LabelColor;
}

export interface UpdateLabelRequest extends CreateLabelRequest {
  labelId: string;
}

export interface DeleteLabelRequest {
  boardId: string;
  actorId: string;
  labelId: string;
}

export interface CardLabelRequest {
  boardId: string;
  userId: string;
  cardId: string;
  labelId: string;
}

export async function findLabelOfBoard(labelId: string, boardId: string): Promise<Label> {
  const label = await labelRepository().findOne({ where: { id: labelId } });

  if (!label || label.boardId !== boardId) {
    throw new AppError("Etiqueta não encontrada", 404);
  }

  return label;
}

async function labelsWithCounts(boardId: string): Promise<LabelWithCountView[]> {
  const labels = await labelRepository().find({
    where: { boardId },
    order: { createdAt: "ASC" },
  });

  if (labels.length === 0) {
    return [];
  }

  const rows = await cardLabelRepository()
    .createQueryBuilder("link")
    .select("link.label_id", "labelId")
    .addSelect("COUNT(link.id)", "total")
    .where("link.label_id IN (:...labelIds)", { labelIds: labels.map((label) => label.id) })
    .groupBy("link.label_id")
    .getRawMany<{ labelId: string; total: string }>();

  const counts = new Map(rows.map((row) => [row.labelId, Number(row.total)]));

  return labels.map((label) => ({
    ...toLabelView(label),
    cardCount: counts.get(label.id) ?? 0,
  }));
}

async function assertNameIsFree(
  boardId: string,
  name: string,
  ignoredLabelId?: string
): Promise<void> {
  const existing = await labelRepository().findOne({ where: { boardId, name } });

  if (existing && existing.id !== ignoredLabelId) {
    throw new AppError("Este quadro já tem uma etiqueta com esse nome", 409);
  }
}

export async function createLabel(data: CreateLabelRequest): Promise<LabelWithCountView[]> {
  await requireBoardAdmin(data.boardId, data.actorId);

  await assertNameIsFree(data.boardId, data.name);

  const repository = labelRepository();

  await repository.save(
    repository.create({ boardId: data.boardId, name: data.name, color: data.color })
  );

  return labelsWithCounts(data.boardId);
}

export async function listLabels(
  boardId: string,
  userId: string
): Promise<LabelWithCountView[]> {
  await requireBoardAccess(boardId, userId);

  return labelsWithCounts(boardId);
}

export async function updateLabel(data: UpdateLabelRequest): Promise<LabelWithCountView[]> {
  await requireBoardAdmin(data.boardId, data.actorId);

  const label = await findLabelOfBoard(data.labelId, data.boardId);

  await assertNameIsFree(data.boardId, data.name, label.id);

  label.name = data.name;
  label.color = data.color;

  await labelRepository().save(label);

  return labelsWithCounts(data.boardId);
}

export async function deleteLabel(data: DeleteLabelRequest): Promise<LabelWithCountView[]> {
  await requireBoardAdmin(data.boardId, data.actorId);

  const label = await findLabelOfBoard(data.labelId, data.boardId);

  await labelRepository().remove(label);

  return labelsWithCounts(data.boardId);
}

export async function applyLabelToCard(data: CardLabelRequest): Promise<LabelView[]> {
  await findOwnedCard(data.cardId, data.boardId, data.userId);

  const label = await findLabelOfBoard(data.labelId, data.boardId);

  const repository = cardLabelRepository();

  const alreadyApplied = await repository.findOne({
    where: { cardId: data.cardId, labelId: label.id },
  });

  if (!alreadyApplied) {
    await repository.save(repository.create({ cardId: data.cardId, labelId: label.id }));
  }

  return labelsOfCard(data.cardId);
}

export async function removeLabelFromCard(data: CardLabelRequest): Promise<LabelView[]> {
  await findOwnedCard(data.cardId, data.boardId, data.userId);

  const repository = cardLabelRepository();

  const link = await repository.findOne({
    where: { cardId: data.cardId, labelId: data.labelId },
  });

  if (link) {
    await repository.remove(link);
  }

  return labelsOfCard(data.cardId);
}
