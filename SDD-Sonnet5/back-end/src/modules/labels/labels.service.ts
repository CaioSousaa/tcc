import { BoardNotFoundError } from "../boards/boards.errors";
import { BoardRepository } from "../boards/repositories/repository.types";
import { LabelNotFoundError } from "./labels.errors";
import { CreateLabelInput, UpdateLabelInput } from "./labels.schemas";
import { Label } from "./entities/label.entity";
import { LabelRepository } from "./repositories/repository.types";

export class LabelsService {
  constructor(
    private readonly labelRepository: LabelRepository,
    private readonly boardRepository: BoardRepository,
  ) {}

  async create(userId: string, boardId: string, input: CreateLabelInput): Promise<Label> {
    await this.assertMember(userId, boardId);
    return this.labelRepository.create({ boardId, name: input.name, color: input.color });
  }

  async list(userId: string, boardId: string): Promise<Label[]> {
    await this.assertMember(userId, boardId);
    return this.labelRepository.findAllByBoard(boardId);
  }

  async update(
    userId: string,
    boardId: string,
    labelId: string,
    input: UpdateLabelInput,
  ): Promise<Label> {
    await this.assertMember(userId, boardId);

    const updated = await this.labelRepository.update(labelId, boardId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
    });
    if (!updated) {
      throw new LabelNotFoundError();
    }
    return updated;
  }

  async remove(userId: string, boardId: string, labelId: string): Promise<void> {
    await this.assertMember(userId, boardId);

    const deleted = await this.labelRepository.delete(labelId, boardId);
    if (!deleted) {
      throw new LabelNotFoundError();
    }
  }

  private async assertMember(userId: string, boardId: string): Promise<void> {
    const board = await this.boardRepository.findByIdAndMember(boardId, userId);
    if (!board) {
      throw new BoardNotFoundError();
    }
  }
}
