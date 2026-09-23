import { Repository } from "typeorm";
import { Label } from "../entities/Label";
import { AppDataSource } from "../database";

export class LabelRepository {
  private repo: Repository<Label>;

  constructor() {
    this.repo = AppDataSource.getRepository(Label);
  }

  async insert(label: Partial<Label>): Promise<Label> {
    const newLabel = this.repo.create(label);
    return this.repo.save(newLabel);
  }

  async findByBoardId(boardId: string): Promise<Label[]> {
    return this.repo.find({
      where: { board_id: boardId },
      order: { created_at: "ASC" },
    });
  }

  async findById(labelId: string, boardId: string): Promise<Label | null> {
    return this.repo.findOne({
      where: { id: labelId, board_id: boardId },
    });
  }

  async findByName(boardId: string, name: string): Promise<Label | null> {
    return this.repo.findOne({
      where: { board_id: boardId, name },
    });
  }

  async update(
    labelId: string,
    boardId: string,
    data: Partial<Label>
  ): Promise<void> {
    await this.repo.update(
      { id: labelId, board_id: boardId },
      data
    );
  }

  async delete(labelId: string, boardId: string): Promise<void> {
    await this.repo.delete({ id: labelId, board_id: boardId });
  }

  async countByLabel(labelId: string): Promise<number> {
    const label = await this.repo.findOne({
      where: { id: labelId },
      relations: { cardLabels: true },
    });
    return label?.cardLabels?.length || 0;
  }
}
