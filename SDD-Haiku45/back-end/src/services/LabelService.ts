import { LabelRepository } from "../repositories/LabelRepository";
import { CardLabelRepository } from "../repositories/CardLabelRepository";
import { BoardMemberRepository } from "../repositories/BoardMemberRepository";
import { Label } from "../entities/Label";
import { CardLabel } from "../entities/CardLabel";
import { MemberRole } from "../entities/BoardMember";
import { ValidationService } from "./ValidationService";

export class LabelService {
  private labelRepository: LabelRepository;
  private cardLabelRepository: CardLabelRepository;
  private memberRepository: BoardMemberRepository;
  private validationService: ValidationService;

  constructor() {
    this.labelRepository = new LabelRepository();
    this.cardLabelRepository = new CardLabelRepository();
    this.memberRepository = new BoardMemberRepository();
    this.validationService = new ValidationService();
  }

  private validateHexColor(color: string): boolean {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(color);
  }

  private validateName(name: string): boolean {
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= 50;
  }

  async createLabel(
    boardId: string,
    name: string,
    color: string,
    userId: string
  ): Promise<Label> {
    const userRole = await this.getMemberRole(boardId, userId);
    if (!userRole || ![MemberRole.ADMIN, MemberRole.EDITOR].includes(userRole as any)) {
      throw new Error("Apenas administradores e editores podem criar etiquetas");
    }

    if (!this.validateName(name)) {
      throw new Error("Nome deve ter entre 1 e 50 caracteres");
    }

    if (!this.validateHexColor(color)) {
      throw new Error("Cor deve ser um valor HEX válido (ex: #FF0000)");
    }

    const existing = await this.labelRepository.findByName(boardId, name.trim());
    if (existing) {
      throw new Error("Já existe etiqueta com este nome neste quadro");
    }

    const label = await this.labelRepository.insert({
      board_id: boardId,
      name: name.trim(),
      color,
    });

    return label;
  }

  async updateLabel(
    boardId: string,
    labelId: string,
    name: string,
    color: string,
    userId: string
  ): Promise<Label> {
    const userRole = await this.getMemberRole(boardId, userId);
    if (!userRole || ![MemberRole.ADMIN, MemberRole.EDITOR].includes(userRole as any)) {
      throw new Error("Apenas administradores e editores podem editar etiquetas");
    }

    const label = await this.labelRepository.findById(labelId, boardId);
    if (!label) {
      throw new Error("Etiqueta não encontrada");
    }

    if (!this.validateName(name)) {
      throw new Error("Nome deve ter entre 1 e 50 caracteres");
    }

    if (!this.validateHexColor(color)) {
      throw new Error("Cor deve ser um valor HEX válido (ex: #FF0000)");
    }

    if (name.trim() !== label.name) {
      const existing = await this.labelRepository.findByName(boardId, name.trim());
      if (existing) {
        throw new Error("Já existe etiqueta com este nome neste quadro");
      }
    }

    await this.labelRepository.update(labelId, boardId, {
      name: name.trim(),
      color,
    });

    const updated = await this.labelRepository.findById(labelId, boardId);
    if (!updated) {
      throw new Error("Erro ao atualizar etiqueta");
    }

    return updated;
  }

  async deleteLabel(boardId: string, labelId: string, userId: string): Promise<void> {
    const userRole = await this.getMemberRole(boardId, userId);
    if (!userRole || ![MemberRole.ADMIN, MemberRole.EDITOR].includes(userRole as any)) {
      throw new Error("Apenas administradores e editores podem deletar etiquetas");
    }

    const label = await this.labelRepository.findById(labelId, boardId);
    if (!label) {
      throw new Error("Etiqueta não encontrada");
    }

    await this.labelRepository.delete(labelId, boardId);
  }

  async getLabelsOfBoard(boardId: string): Promise<Array<Label & { card_count: number }>> {
    const labels = await this.labelRepository.findByBoardId(boardId);

    const labelsWithCount = await Promise.all(
      labels.map(async (label) => {
        const count = await this.labelRepository.countByLabel(label.id);
        return { ...label, card_count: count };
      })
    );

    return labelsWithCount;
  }

  async getCardLabelLinks(cardId: string): Promise<Array<Label & { card_label_id: string }>> {
    const cardLabels = await this.cardLabelRepository.findByCardId(cardId);
    return cardLabels.map((cl) => Object.assign(cl.label, { card_label_id: cl.id }));
  }

  async getLabelsOfCard(cardId: string): Promise<Label[]> {
    const cardLabels = await this.cardLabelRepository.findByCardId(cardId);
    return cardLabels.map((cl) => cl.label);
  }

  async applyLabel(
    boardId: string,
    cardId: string,
    labelId: string,
    userId: string
  ): Promise<CardLabel> {
    const userRole = await this.getMemberRole(boardId, userId);
    if (!userRole || ![MemberRole.ADMIN, MemberRole.EDITOR].includes(userRole as any)) {
      throw new Error("Apenas administradores e editores podem aplicar etiquetas");
    }

    const label = await this.labelRepository.findById(labelId, boardId);
    if (!label) {
      throw new Error("Etiqueta não encontrada");
    }

    const duplicate = await this.cardLabelRepository.findDuplicate(cardId, labelId);
    if (duplicate) {
      throw new Error("Etiqueta já foi aplicada a este cartão");
    }

    const cardLabel = await this.cardLabelRepository.insert({
      card_id: cardId,
      label_id: labelId,
    });

    return cardLabel;
  }

  async removeLabel(
    boardId: string,
    cardId: string,
    cardLabelId: string,
    userId: string
  ): Promise<void> {
    const userRole = await this.getMemberRole(boardId, userId);
    if (!userRole || ![MemberRole.ADMIN, MemberRole.EDITOR].includes(userRole as any)) {
      throw new Error("Apenas administradores e editores podem remover etiquetas");
    }

    await this.cardLabelRepository.delete(cardLabelId);
  }

  private async getMemberRole(boardId: string, userId: string): Promise<string | null> {
    const member = await this.memberRepository.findByUserAndBoard(userId, boardId);
    return member?.role || null;
  }
}
