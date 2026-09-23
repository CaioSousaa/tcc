import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error-handler";
import { buildAuthRouter } from "./modules/auth/auth.routes";
import { AuthService } from "./modules/auth/auth.service";
import { buildBoardsRouter } from "./modules/boards/boards.routes";
import { BoardsService } from "./modules/boards/boards.service";
import { buildBoardsMembersRouter } from "./modules/boards/boards-members.routes";
import { BoardsMembersService } from "./modules/boards/boards-members.service";
import { buildListsRouter } from "./modules/lists/lists.routes";
import { ListsService } from "./modules/lists/lists.service";
import { buildCardsRouter } from "./modules/cards/cards.routes";
import { CardsService } from "./modules/cards/cards.service";
import { buildCardsAssignmentsRouter } from "./modules/cards/cards-assignments.routes";
import { CardsAssignmentsService } from "./modules/cards/cards-assignments.service";
import { buildCardsLabelsRouter } from "./modules/cards/cards-labels.routes";
import { CardsLabelsService } from "./modules/cards/cards-labels.service";
import { buildCardsCommentsRouter } from "./modules/cards/cards-comments.routes";
import { CardsCommentsService } from "./modules/cards/cards-comments.service";
import { buildChecklistsRouter } from "./modules/checklists/checklists.routes";
import { ChecklistsService } from "./modules/checklists/checklists.service";
import { buildLabelsRouter } from "./modules/labels/labels.routes";
import { LabelsService } from "./modules/labels/labels.service";

export interface AppDependencies {
  authService: AuthService;
  boardsService: BoardsService;
  boardsMembersService: BoardsMembersService;
  listsService: ListsService;
  cardsService: CardsService;
  cardsAssignmentsService: CardsAssignmentsService;
  cardsLabelsService: CardsLabelsService;
  cardsCommentsService: CardsCommentsService;
  checklistsService: ChecklistsService;
  labelsService: LabelsService;
}

export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use("/auth", buildAuthRouter(deps.authService));
  app.use(
    "/boards/:boardId/lists/:listId/cards/:cardId/checklists",
    buildChecklistsRouter(deps.checklistsService),
  );
  app.use(
    "/boards/:boardId/lists/:listId/cards/:cardId/assignees",
    buildCardsAssignmentsRouter(deps.cardsAssignmentsService),
  );
  app.use(
    "/boards/:boardId/lists/:listId/cards/:cardId/labels",
    buildCardsLabelsRouter(deps.cardsLabelsService),
  );
  app.use(
    "/boards/:boardId/lists/:listId/cards/:cardId/comments",
    buildCardsCommentsRouter(deps.cardsCommentsService),
  );
  app.use("/boards/:boardId/lists/:listId/cards", buildCardsRouter(deps.cardsService));
  app.use("/boards/:boardId/lists", buildListsRouter(deps.listsService));
  app.use("/boards/:boardId/members", buildBoardsMembersRouter(deps.boardsMembersService));
  app.use("/boards/:boardId/labels", buildLabelsRouter(deps.labelsService));
  app.use("/boards", buildBoardsRouter(deps.boardsService));

  app.use(errorHandler);

  return app;
}
