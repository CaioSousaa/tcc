import "reflect-metadata";
import { createApp } from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./config/data-source";
import { AuthService } from "./modules/auth/auth.service";
import { RefreshToken } from "./modules/auth/entities/refresh-token.entity";
import { User } from "./modules/auth/entities/user.entity";
import { TypeOrmRefreshTokenRepository } from "./modules/auth/repositories/typeorm-refresh-token.repository";
import { TypeOrmUserRepository } from "./modules/auth/repositories/typeorm-user.repository";
import { BoardsService } from "./modules/boards/boards.service";
import { BoardsMembersService } from "./modules/boards/boards-members.service";
import { Board } from "./modules/boards/entities/board.entity";
import { BoardMember } from "./modules/boards/entities/board-member.entity";
import { TypeOrmBoardRepository } from "./modules/boards/repositories/typeorm-board.repository";
import { TypeOrmBoardMemberRepository } from "./modules/boards/repositories/typeorm-board-member.repository";
import { ListsService } from "./modules/lists/lists.service";
import { List } from "./modules/lists/entities/list.entity";
import { TypeOrmListRepository } from "./modules/lists/repositories/typeorm-list.repository";
import { CardsService } from "./modules/cards/cards.service";
import { CardsAssignmentsService } from "./modules/cards/cards-assignments.service";
import { CardsLabelsService } from "./modules/cards/cards-labels.service";
import { CardsCommentsService } from "./modules/cards/cards-comments.service";
import { Card } from "./modules/cards/entities/card.entity";
import { CardAssignment } from "./modules/cards/entities/card-assignment.entity";
import { CardLabel } from "./modules/cards/entities/card-label.entity";
import { Comment } from "./modules/cards/entities/comment.entity";
import { TypeOrmCardRepository } from "./modules/cards/repositories/typeorm-card.repository";
import { TypeOrmCardAssignmentRepository } from "./modules/cards/repositories/typeorm-card-assignment.repository";
import { TypeOrmCardLabelRepository } from "./modules/cards/repositories/typeorm-card-label.repository";
import { TypeOrmCommentRepository } from "./modules/cards/repositories/typeorm-comment.repository";
import { ChecklistsService } from "./modules/checklists/checklists.service";
import { Checklist } from "./modules/checklists/entities/checklist.entity";
import { ChecklistItem } from "./modules/checklists/entities/checklist-item.entity";
import { TypeOrmChecklistRepository } from "./modules/checklists/repositories/typeorm-checklist.repository";
import { LabelsService } from "./modules/labels/labels.service";
import { Label } from "./modules/labels/entities/label.entity";
import { TypeOrmLabelRepository } from "./modules/labels/repositories/typeorm-label.repository";

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  const userRepository = new TypeOrmUserRepository(AppDataSource.getRepository(User));
  const refreshTokenRepository = new TypeOrmRefreshTokenRepository(
    AppDataSource.getRepository(RefreshToken),
  );
  const authService = new AuthService(userRepository, refreshTokenRepository);

  const boardRepository = new TypeOrmBoardRepository(AppDataSource.getRepository(Board));
  const boardMemberRepository = new TypeOrmBoardMemberRepository(
    AppDataSource.getRepository(BoardMember),
  );
  const boardsService = new BoardsService(boardRepository, boardMemberRepository);

  const listRepository = new TypeOrmListRepository(AppDataSource.getRepository(List));
  const cardRepository = new TypeOrmCardRepository(AppDataSource.getRepository(Card));
  const cardAssignmentRepository = new TypeOrmCardAssignmentRepository(
    AppDataSource.getRepository(CardAssignment),
  );
  const cardLabelRepository = new TypeOrmCardLabelRepository(
    AppDataSource.getRepository(CardLabel),
  );
  const commentRepository = new TypeOrmCommentRepository(AppDataSource.getRepository(Comment));
  const checklistRepository = new TypeOrmChecklistRepository(
    AppDataSource.getRepository(Checklist),
    AppDataSource.getRepository(ChecklistItem),
  );
  const labelRepository = new TypeOrmLabelRepository(AppDataSource.getRepository(Label));

  const boardsMembersService = new BoardsMembersService(
    boardMemberRepository,
    userRepository,
    cardAssignmentRepository,
  );

  const labelsService = new LabelsService(labelRepository, boardRepository);

  const listsService = new ListsService(
    listRepository,
    boardRepository,
    cardRepository,
    checklistRepository,
    commentRepository,
  );
  const cardsService = new CardsService(
    cardRepository,
    listRepository,
    boardRepository,
    checklistRepository,
    cardAssignmentRepository,
    cardLabelRepository,
    commentRepository,
  );
  const cardsAssignmentsService = new CardsAssignmentsService(
    cardAssignmentRepository,
    cardRepository,
    listRepository,
    boardRepository,
    boardMemberRepository,
  );
  const cardsLabelsService = new CardsLabelsService(
    cardLabelRepository,
    cardRepository,
    listRepository,
    boardRepository,
    labelRepository,
  );
  const cardsCommentsService = new CardsCommentsService(
    commentRepository,
    cardRepository,
    listRepository,
    boardRepository,
  );
  const checklistsService = new ChecklistsService(
    checklistRepository,
    cardRepository,
    listRepository,
    boardRepository,
  );

  const app = createApp({
    authService,
    boardsService,
    boardsMembersService,
    listsService,
    cardsService,
    cardsAssignmentsService,
    cardsLabelsService,
    cardsCommentsService,
    checklistsService,
    labelsService,
  });

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
