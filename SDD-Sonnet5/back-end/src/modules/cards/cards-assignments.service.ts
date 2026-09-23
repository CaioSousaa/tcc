import { BoardNotFoundError } from "../boards/boards.errors";
import { ForbiddenRoleError, MemberNotFoundError } from "../boards/boards-members.errors";
import { BoardRepository } from "../boards/repositories/repository.types";
import { BoardMemberRepository } from "../boards/repositories/board-member.repository.types";
import { ListNotFoundError } from "../lists/lists.errors";
import { ListRepository } from "../lists/repositories/repository.types";
import { AssignmentNotFoundError } from "./cards-assignments.errors";
import { CardNotFoundError } from "./cards.errors";
import { CardRepository } from "./repositories/repository.types";
import { CardAssignmentRepository } from "./repositories/card-assignment.repository.types";

export interface AssignedMember {
  userId: string;
  name: string;
  email: string;
}

export class CardsAssignmentsService {
  constructor(
    private readonly cardAssignmentRepository: CardAssignmentRepository,
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly boardRepository: BoardRepository,
    private readonly boardMemberRepository: BoardMemberRepository,
  ) {}

  async assign(
    actorId: string,
    boardId: string,
    listId: string,
    cardId: string,
    targetUserId: string,
  ): Promise<AssignedMember> {
    await this.resolveCard(actorId, boardId, listId, cardId);
    await this.assertAdmin(actorId, boardId);

    const members = await this.boardMemberRepository.findAllByBoardWithUser(boardId);
    const target = members.find((m) => m.userId === targetUserId);
    if (!target) {
      throw new MemberNotFoundError();
    }

    await this.cardAssignmentRepository.create({ cardId, userId: targetUserId, boardId });

    return { userId: target.userId, name: target.name, email: target.email };
  }

  async unassign(
    actorId: string,
    boardId: string,
    listId: string,
    cardId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.resolveCard(actorId, boardId, listId, cardId);
    await this.assertAdmin(actorId, boardId);

    const deleted = await this.cardAssignmentRepository.delete(cardId, targetUserId);
    if (!deleted) {
      throw new AssignmentNotFoundError();
    }
  }

  private async resolveCard(
    actorId: string,
    boardId: string,
    listId: string,
    cardId: string,
  ): Promise<void> {
    const board = await this.boardRepository.findByIdAndMember(boardId, actorId);
    if (!board) {
      throw new BoardNotFoundError();
    }

    const list = await this.listRepository.findByIdAndBoard(listId, boardId);
    if (!list) {
      throw new ListNotFoundError();
    }

    const card = await this.cardRepository.findByIdAndList(cardId, listId);
    if (!card) {
      throw new CardNotFoundError();
    }
  }

  private async assertAdmin(actorId: string, boardId: string): Promise<void> {
    const membership = await this.boardMemberRepository.findByBoardAndUser(boardId, actorId);
    if (!membership || membership.role !== "administrador") {
      throw new ForbiddenRoleError();
    }
  }
}
