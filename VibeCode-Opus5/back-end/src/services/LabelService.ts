import { AppDataSource } from "../data-source";
import { Label } from "../entities/Label";
import type { CreateLabelInput, UpdateLabelInput } from "../schemas/label.schema";
import { AppError } from "../utils/AppError";
import { boardService } from "./BoardService";

export interface PublicLabel {
  id: string;
  name: string;
  color: string;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicLabel(label: Label): PublicLabel {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
    boardId: label.boardId,
    createdAt: label.createdAt,
    updatedAt: label.updatedAt,
  };
}

export class LabelService {
  private get labels() {
    return AppDataSource.getRepository(Label);
  }

  async list(userId: string, boardId: string): Promise<PublicLabel[]> {
    await boardService.getAccessibleBoard(userId, boardId);

    const labels = await this.labels.find({
      where: { boardId },
      order: { createdAt: "ASC" },
    });

    return labels.map(toPublicLabel);
  }

  async create(
    userId: string,
    boardId: string,
    input: CreateLabelInput,
  ): Promise<PublicLabel> {
    await boardService.requireAdmin(userId, boardId);

    const existing = await this.labels.findOne({
      where: { boardId, name: input.name },
    });

    if (existing) {
      throw new AppError("Já existe uma etiqueta com esse nome.", 409, {
        name: "Já existe uma etiqueta com esse nome.",
      });
    }

    const label = this.labels.create({
      name: input.name,
      color: input.color,
      boardId,
    });

    await this.labels.save(label);

    return toPublicLabel(label);
  }

  async update(
    userId: string,
    boardId: string,
    labelId: string,
    input: UpdateLabelInput,
  ): Promise<PublicLabel> {
    await boardService.requireAdmin(userId, boardId);

    const label = await this.getBoardLabel(boardId, labelId);

    if (input.name !== undefined) {
      const existing = await this.labels.findOne({
        where: { boardId, name: input.name },
      });

      if (existing && existing.id !== labelId) {
        throw new AppError("Já existe uma etiqueta com esse nome.", 409, {
          name: "Já existe uma etiqueta com esse nome.",
        });
      }

      label.name = input.name;
    }

    if (input.color !== undefined) {
      label.color = input.color;
    }

    await this.labels.save(label);

    return toPublicLabel(label);
  }

  async remove(userId: string, boardId: string, labelId: string): Promise<void> {
    await boardService.requireAdmin(userId, boardId);

    const label = await this.getBoardLabel(boardId, labelId);

    await this.labels.remove(label);
  }

  private async getBoardLabel(boardId: string, labelId: string): Promise<Label> {
    const label = await this.labels.findOne({ where: { id: labelId } });

    if (!label || label.boardId !== boardId) {
      throw new AppError("Etiqueta não encontrada.", 404);
    }

    return label;
  }
}

export const labelService = new LabelService();
