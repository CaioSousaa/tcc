import "reflect-metadata";
import { DataSource } from "typeorm";
import type { Env } from "./env";
import { Board } from "../entities/Board";
import { BoardInvitation } from "../entities/BoardInvitation";
import { BoardList } from "../entities/BoardList";
import { BoardMember } from "../entities/BoardMember";
import { Card } from "../entities/Card";
import { CardAssignee } from "../entities/CardAssignee";
import { CardComment } from "../entities/CardComment";
import { CardLabel } from "../entities/CardLabel";
import { ChecklistItem } from "../entities/ChecklistItem";
import { Label } from "../entities/Label";
import { User } from "../entities/User";
import { CreateUsersTable1760000000000 } from "../migrations/1760000000000-CreateUsersTable";
import { CreateBoardsListsCards1760000001000 } from "../migrations/1760000001000-CreateBoardsListsCards";
import { ListPositionsAndNameLimit1760000002000 } from "../migrations/1760000002000-ListPositionsAndNameLimit";
import { CardsContentAndPositions1760000003000 } from "../migrations/1760000003000-CardsContentAndPositions";
import { BoardListDeletionLock1760000004000 } from "../migrations/1760000004000-BoardListDeletionLock";
import { CreateChecklistItems1760000005000 } from "../migrations/1760000005000-CreateChecklistItems";
import { BoardMembersInvitationsAssignees1760000006000 } from "../migrations/1760000006000-BoardMembersInvitationsAssignees";
import { CreateLabels1760000007000 } from "../migrations/1760000007000-CreateLabels";
import { CreateCardComments1760000008000 } from "../migrations/1760000008000-CreateCardComments";
import { CardDueDate1760000009000 } from "../migrations/1760000009000-CardDueDate";

export function createDataSource(env: Env): DataSource {
  return new DataSource({
    type: "postgres",
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    entities: [User, Board, BoardList, Card, ChecklistItem, BoardMember, BoardInvitation, CardAssignee, Label, CardLabel, CardComment],
    migrations: [
      CreateUsersTable1760000000000,
      CreateBoardsListsCards1760000001000,
      ListPositionsAndNameLimit1760000002000,
      CardsContentAndPositions1760000003000,
      BoardListDeletionLock1760000004000,
      CreateChecklistItems1760000005000,
      BoardMembersInvitationsAssignees1760000006000,
      CreateLabels1760000007000,
      CreateCardComments1760000008000,
      CardDueDate1760000009000,
    ],
    // Schema changes only through versioned migrations.
    synchronize: false,
    migrationsRun: true,
    logging: env.NODE_ENV === "development" ? ["error", "migration"] : ["error"],
  });
}
