import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { AssigneeController } from "./controllers/AssigneeController";
import { AuthController } from "./controllers/AuthController";
import { BoardController } from "./controllers/BoardController";
import { CardController } from "./controllers/CardController";
import { CardLabelController } from "./controllers/CardLabelController";
import { ChecklistController } from "./controllers/ChecklistController";
import { CommentController } from "./controllers/CommentController";
import { InvitationController } from "./controllers/InvitationController";
import { LabelController } from "./controllers/LabelController";
import { ListController } from "./controllers/ListController";
import { MemberController } from "./controllers/MemberController";
import { errorHandler } from "./middlewares/errorHandler";
import type { AssigneeRepository } from "./repositories/AssigneeRepository";
import type { BoardCardRepository } from "./repositories/BoardCardRepository";
import type { CardLabelRepository } from "./repositories/CardLabelRepository";
import type { BoardListRepository } from "./repositories/BoardListRepository";
import type { BoardRepository } from "./repositories/BoardRepository";
import type { ChecklistRepository } from "./repositories/ChecklistRepository";
import type { CommentRepository } from "./repositories/CommentRepository";
import type { InvitationRepository } from "./repositories/InvitationRepository";
import type { LabelRepository } from "./repositories/LabelRepository";
import type { MemberRepository } from "./repositories/MemberRepository";
import type { UserRepository } from "./repositories/UserRepository";
import { apiRoutes } from "./routes";
import { AssigneeService } from "./services/AssigneeService";
import { AuthService } from "./services/AuthService";
import { BoardService } from "./services/BoardService";
import { CardLabelService } from "./services/CardLabelService";
import { CardService } from "./services/CardService";
import { ChecklistService } from "./services/ChecklistService";
import { CommentService } from "./services/CommentService";
import { InvitationService } from "./services/InvitationService";
import { LabelService } from "./services/LabelService";
import { ListService } from "./services/ListService";
import { MemberService } from "./services/MemberService";
import { PasswordService } from "./services/PasswordService";
import { TokenService } from "./services/TokenService";

export type AppConfig = {
  corsOrigin: string;
  secureCookies: boolean;
  jwtSecret: string;
  persistentTtlDays: number;
  shortTtlHours: number;
};

export type AppRepositories = {
  users: UserRepository;
  boards: BoardRepository;
  lists: BoardListRepository;
  cards: BoardCardRepository;
  checklist: ChecklistRepository;
  members: MemberRepository;
  invitations: InvitationRepository;
  assignees: AssigneeRepository;
  labels: LabelRepository;
  cardLabels: CardLabelRepository;
  comments: CommentRepository;
};

const SECONDS_PER_HOUR = 60 * 60;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

export function createApp(config: AppConfig, repositories: AppRepositories): Express {
  const persistentTtlSeconds = config.persistentTtlDays * SECONDS_PER_DAY;

  const tokenService = new TokenService({
    secret: config.jwtSecret,
    persistentTtlSeconds,
    shortTtlSeconds: config.shortTtlHours * SECONDS_PER_HOUR,
  });
  const authService = new AuthService(repositories.users, new PasswordService(), tokenService);
  const authController = new AuthController(authService, {
    secure: config.secureCookies,
    persistentMaxAgeMs: persistentTtlSeconds * 1000,
  });

  const boardController = new BoardController(new BoardService(repositories.boards));
  const listController = new ListController(new ListService(repositories.lists));
  const cardController = new CardController(new CardService(repositories.cards));
  const checklistController = new ChecklistController(new ChecklistService(repositories.checklist));
  const memberController = new MemberController(new MemberService(repositories.members));
  const invitationController = new InvitationController(new InvitationService(repositories.invitations));
  const assigneeController = new AssigneeController(new AssigneeService(repositories.assignees));
  const labelController = new LabelController(new LabelService(repositories.labels));
  const cardLabelController = new CardLabelController(new CardLabelService(repositories.cardLabels));
  const commentController = new CommentController(new CommentService(repositories.comments));

  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    }),
  );
  // 64 KB: a valid 5,000-character description may take ~20 KB in UTF-8 plus JSON escapes (RF04 plan 3.4, C84).
  app.use(express.json({ limit: "64kb" }));
  app.use(cookieParser());

  app.use(
    "/api",
    apiRoutes({
      authController,
      authService,
      boardController,
      listController,
      cardController,
      checklistController,
      memberController,
      invitationController,
      assigneeController,
      labelController,
      cardLabelController,
      commentController,
    }),
  );

  app.use(errorHandler());

  return app;
}
