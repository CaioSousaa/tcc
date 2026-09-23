import { Repository } from "typeorm";
import { Label } from "../entities/Label";
import { Card } from "../entities/Card";
import { Board } from "../entities/Board";

export class LabelService {
  constructor(
    private labelRepository: Repository<Label>,
    private cardRepository: Repository<Card>,
    private boardRepository: Repository<Board>
  ) {}

  async createLabel(boardId: string, userId: string, name: string, color?: string): Promise<Label> {
    const board = await this.boardRepository.findOne({ where: { id: boardId, userId } });
    if (!board) {
      throw new Error("Board not found");
    }

    if (!name.trim()) {
      throw new Error("Label name is required");
    }

    const label = this.labelRepository.create({
      name,
      color: color || "#3B82F6",
      boardId,
    });

    return this.labelRepository.save(label);
  }

  async getLabels(boardId: string): Promise<Label[]> {
    return this.labelRepository.find({
      where: { boardId },
      order: { createdAt: "ASC" },
    });
  }

  async updateLabel(labelId: string, userId: string, data: { name?: string; color?: string }): Promise<Label> {
    const label = await this.labelRepository.findOne({
      where: { id: labelId },
      relations: { board: true },
    });

    if (!label || label.board.userId !== userId) {
      throw new Error("Label not found");
    }

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error("Label name is required");
      }
      label.name = data.name;
    }

    if (data.color !== undefined) {
      label.color = data.color;
    }

    return this.labelRepository.save(label);
  }

  async deleteLabel(labelId: string, userId: string): Promise<void> {
    const label = await this.labelRepository.findOne({
      where: { id: labelId },
      relations: { board: true },
    });

    if (!label || label.board.userId !== userId) {
      throw new Error("Label not found");
    }

    await this.labelRepository.remove(label);
  }

  async addLabelToCard(cardId: string, labelId: string, userId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: { list: { board: true }, labels: true },
    });

    if (!card || card.list.board.userId !== userId) {
      throw new Error("Card not found");
    }

    const label = await this.labelRepository.findOne({ where: { id: labelId } });
    if (!label) {
      throw new Error("Label not found");
    }

    if (!card.labels.find((l) => l.id === labelId)) {
      card.labels.push(label);
      return this.cardRepository.save(card);
    }

    return card;
  }

  async removeLabelFromCard(cardId: string, labelId: string, userId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: { list: { board: true }, labels: true },
    });

    if (!card || card.list.board.userId !== userId) {
      throw new Error("Card not found");
    }

    card.labels = card.labels.filter((l) => l.id !== labelId);
    return this.cardRepository.save(card);
  }
}
