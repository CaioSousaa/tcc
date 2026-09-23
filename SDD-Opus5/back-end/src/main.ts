import "dotenv/config";
import "reflect-metadata";
import { createApp } from "./app";
import { createDataSource } from "./config/data-source";
import { parseEnv } from "./config/env";
import { TypeOrmAssigneeRepository } from "./repositories/AssigneeRepository";
import { TypeOrmBoardCardRepository } from "./repositories/BoardCardRepository";
import { TypeOrmBoardListRepository } from "./repositories/BoardListRepository";
import { TypeOrmCardLabelRepository } from "./repositories/CardLabelRepository";
import { TypeOrmBoardRepository } from "./repositories/BoardRepository";
import { TypeOrmCommentRepository } from "./repositories/CommentRepository";
import { TypeOrmChecklistRepository } from "./repositories/ChecklistRepository";
import { TypeOrmInvitationRepository } from "./repositories/InvitationRepository";
import { TypeOrmLabelRepository } from "./repositories/LabelRepository";
import { TypeOrmMemberRepository } from "./repositories/MemberRepository";
import { TypeOrmUserRepository } from "./repositories/UserRepository";

async function bootstrap(): Promise<void> {
  const env = parseEnv(process.env);

  // The database must be reachable (and migrated) before accepting connections.
  const dataSource = createDataSource(env);
  await dataSource.initialize();

  const app = createApp(
    {
      corsOrigin: env.CORS_ORIGIN,
      secureCookies: env.NODE_ENV === "production",
      jwtSecret: env.JWT_SECRET,
      persistentTtlDays: env.SESSION_PERSISTENT_TTL_DAYS,
      shortTtlHours: env.SESSION_SHORT_TTL_HOURS,
    },
    {
      users: new TypeOrmUserRepository(dataSource),
      boards: new TypeOrmBoardRepository(dataSource),
      lists: new TypeOrmBoardListRepository(dataSource),
      cards: new TypeOrmBoardCardRepository(dataSource),
      checklist: new TypeOrmChecklistRepository(dataSource),
      members: new TypeOrmMemberRepository(dataSource),
      invitations: new TypeOrmInvitationRepository(dataSource),
      assignees: new TypeOrmAssigneeRepository(dataSource),
      labels: new TypeOrmLabelRepository(dataSource),
      cardLabels: new TypeOrmCardLabelRepository(dataSource),
      comments: new TypeOrmCommentRepository(dataSource),
    },
  );

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start server:", error instanceof Error ? error.message : error);
  process.exit(1);
});
