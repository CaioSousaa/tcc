import { Repository } from "typeorm";
import { Label } from "../entities/label.entity";
import { LabelRepository, CreateLabelData, UpdateLabelData } from "./repository.types";

export class TypeOrmLabelRepository implements LabelRepository {
  constructor(private readonly repo: Repository<Label>) {}

  async create(data: CreateLabelData): Promise<Label> {
    const label = this.repo.create({
      boardId: data.boardId,
      name: data.name,
      color: data.color,
    });
    return this.repo.save(label);
  }

  async findAllByBoard(boardId: string): Promise<Label[]> {
    return this.repo.find({ where: { boardId }, order: { createdAt: "ASC" } });
  }

  async findByIdAndBoard(id: string, boardId: string): Promise<Label | null> {
    return this.repo.findOne({ where: { id, boardId } });
  }

  async update(id: string, boardId: string, data: UpdateLabelData): Promise<Label | null> {
    if (Object.keys(data).length === 0) {
      return this.repo.findOne({ where: { id, boardId } });
    }

    const result = await this.repo.update({ id, boardId }, data);
    if (!result.affected) {
      return null;
    }
    return this.repo.findOne({ where: { id, boardId } });
  }

  async delete(id: string, boardId: string): Promise<boolean> {
    const result = await this.repo.delete({ id, boardId });
    return (result.affected ?? 0) > 0;
  }
}
