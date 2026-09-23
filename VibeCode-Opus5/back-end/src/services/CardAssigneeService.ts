import { AppDataSource } from "../data-source";
import { Board } from "../entities/Board";
import { BoardMember } from "../entities/BoardMember";
import { Card } from "../entities/Card";
import { CardAssignee } from "../entities/CardAssignee";
import { List } from "../entities/List";
import type { CreateCardAssigneeInput } from "../schemas/card-assignee.schema";
import { AppError } from "../utils/AppError";
import { boardService } from "./BoardService";

export interface PublicCardAssignee {
  id: string;
  cardId: string;
  userId: string;
}

function toPublicCardAssignee(assignee: CardAssignee): PublicCardAssignee {
  return {
    id: assignee.id,
    cardId: assignee.cardId,
    userId: assignee.userId,
  };
}

export class CardAssigneeService {
  private get assignees() {
    return AppDataSource.getRepository(CardAssignee);
  }

  async list(userId: string, boardId: string): Promise<PublicCardAssignee[]> {
    await boardService.getAccessibleBoard(userId, boardId);

    const rows = await this.assignees
      .createQueryBuilder("assignee")
      .innerJoin(Card, "card", "card.id = assignee.card_id")
      .innerJoin(List, "list", "list.id = card.list_id")
      .where("list.board_id = :boardId", { boardId })
      .getMany();

    return rows.map(toPublicCardAssignee);
  }

  async create(
    userId: string,
    boardId: string,
    input: CreateCardAssigneeInput,
  ): Promise<PublicCardAssignee> {
    const { board } = await boardService.getAccessibleBoard(userId, boardId);

    await this.getBoardCard(boardId, input.cardId);
    await this.requireBoardMember(board, input.userId);

    const existing = await this.assignees.findOne({
      where: { cardId: input.cardId, userId: input.userId },
    });

    if (existing) {
      return toPublicCardAssignee(existing);
    }

    const created = this.assignees.create({
      cardId: input.cardId,
      userId: input.userId,
    });

    await this.assignees.save(created);

    return toPublicCardAssignee(created);
  }

  async remove(
    userId: string,
    boardId: string,
    assigneeId: string,
  ): Promise<void> {
    await boardService.getAccessibleBoard(userId, boardId);

    const assignee = await this.assignees.findOne({
      where: { id: assigneeId },
    });

    if (!assignee) {
      throw new AppError("Atribuição não encontrada.", 404);
    }

    await this.getBoardCard(boardId, assignee.cardId);
    await this.assignees.remove(assignee);
  }

  private async getBoardCard(boardId: string, cardId: string): Promise<Card> {
    const card = await AppDataSource.getRepository(Card).findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new AppError("Card não encontrado.", 404);
    }

    const list = await AppDataSource.getRepository(List).findOne({
      where: { id: card.listId },
    });

    if (!list || list.boardId !== boardId) {
      throw new AppError("Card não encontrado.", 404);
    }

    return card;
  }

  private async requireBoardMember(
    board: Board,
    userId: string,
  ): Promise<void> {
    if (board.ownerId === userId) {
      return;
    }

    const member = await AppDataSource.getRepository(BoardMember).findOne({
      where: { boardId: board.id, userId, status: "active" },
    });

    if (!member) {
      throw new AppError(
        "Só é possível atribuir membros do quadro.",
        422,
        { userId: "Só é possível atribuir membros do quadro." },
      );
    }
  }
}

export const cardAssigneeService = new CardAssigneeService();
