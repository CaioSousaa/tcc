import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../modules/auth/entities/user.entity";
import { RefreshToken } from "../modules/auth/entities/refresh-token.entity";
import { Board } from "../modules/boards/entities/board.entity";
import { BoardMember } from "../modules/boards/entities/board-member.entity";
import { List } from "../modules/lists/entities/list.entity";
import { Card } from "../modules/cards/entities/card.entity";
import { CardAssignment } from "../modules/cards/entities/card-assignment.entity";
import { Checklist } from "../modules/checklists/entities/checklist.entity";
import { ChecklistItem } from "../modules/checklists/entities/checklist-item.entity";
import { Label } from "../modules/labels/entities/label.entity";
import { CardLabel } from "../modules/cards/entities/card-label.entity";
import { Comment } from "../modules/cards/entities/comment.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.postgres.host,
  port: env.postgres.port,
  username: env.postgres.user,
  password: env.postgres.password,
  database: env.postgres.database,
  synchronize: env.nodeEnv !== "production",
  logging: false,
  entities: [
    User,
    RefreshToken,
    Board,
    BoardMember,
    List,
    Card,
    CardAssignment,
    Checklist,
    ChecklistItem,
    Label,
    CardLabel,
    Comment,
  ],
});
