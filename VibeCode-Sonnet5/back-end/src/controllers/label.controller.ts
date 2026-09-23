import { Request, Response } from "express";
import { AppDataSource } from "../utils/data-source";
import { LABEL_COLORS, Label, LabelColor } from "../entities/Label";
import { CardLabel } from "../entities/CardLabel";
import { findAccessibleBoard, requireBoardAdmin } from "../utils/ownership";

const MAX_NAME_LENGTH = 60;

function isValidColor(color: unknown): color is LabelColor {
  return (
    typeof color === "string" &&
    (LABEL_COLORS as readonly string[]).includes(color)
  );
}

export async function listLabels(req: Request, res: Response): Promise<void> {
  const board = await findAccessibleBoard(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!board) {
    res.status(404).json({ error: "Quadro não encontrado." });
    return;
  }

  const labelRepository = AppDataSource.getRepository(Label);
  const labels = await labelRepository.find({
    where: { boardId: board.id },
    order: { createdAt: "ASC" },
  });

  const counts = labels.length
    ? ((await AppDataSource.getRepository(CardLabel)
        .createQueryBuilder("cardLabel")
        .select("cardLabel.label_id", "labelId")
        .addSelect("COUNT(*)", "count")
        .where("cardLabel.label_id IN (:...labelIds)", {
          labelIds: labels.map((label) => label.id),
        })
        .groupBy("cardLabel.label_id")
        .getRawMany()) as { labelId: string; count: string }[])
    : [];
  const countByLabel = new Map(counts.map((row) => [row.labelId, Number(row.count)]));

  res.status(200).json({
    labels: labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
      boardId: label.boardId,
      cardCount: countByLabel.get(label.id) ?? 0,
      createdAt: label.createdAt,
    })),
  });
}

export async function createLabel(req: Request, res: Response): Promise<void> {
  const { name, color } = req.body as { name?: string; color?: string };

  if (!name?.trim()) {
    res.status(400).json({ error: "Nome da etiqueta é obrigatório." });
    return;
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    res
      .status(400)
      .json({ error: `Nome da etiqueta deve ter no máximo ${MAX_NAME_LENGTH} caracteres.` });
    return;
  }

  if (!isValidColor(color)) {
    res.status(400).json({ error: "Cor inválida." });
    return;
  }

  const access = await requireBoardAdmin(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }

  const labelRepository = AppDataSource.getRepository(Label);
  const label = labelRepository.create({
    name: name.trim(),
    color,
    boardId: access.board.id,
  });
  await labelRepository.save(label);

  res.status(201).json({
    label: {
      id: label.id,
      name: label.name,
      color: label.color,
      boardId: label.boardId,
      cardCount: 0,
      createdAt: label.createdAt,
    },
  });
}

export async function deleteLabel(req: Request, res: Response): Promise<void> {
  const access = await requireBoardAdmin(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }

  const labelRepository = AppDataSource.getRepository(Label);
  const label = await labelRepository.findOne({
    where: { id: req.params.id as string, boardId: access.board.id },
  });
  if (!label) {
    res.status(404).json({ error: "Etiqueta não encontrada." });
    return;
  }

  await labelRepository.remove(label);

  res.status(204).send();
}
