import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env";
import { User } from "../modules/users/entities/User";
import { RefreshToken } from "../modules/auth/entities/RefreshToken";
import { Board } from "../modules/boards/entities/Board";
import { BoardList } from "../modules/lists/entities/BoardList";
import { Card } from "../modules/cards/entities/Card";
import { ChecklistItem } from "../modules/checklists/entities/ChecklistItem";
import { BoardMember } from "../modules/members/entities/BoardMember";
import { CardAssignee } from "../modules/members/entities/CardAssignee";
import { Label } from "../modules/labels/entities/Label";
import { CardLabel } from "../modules/labels/entities/CardLabel";
import { Comment } from "../modules/comments/entities/Comment";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.database.host,
  port: env.database.port,
  username: env.database.user,
  password: env.database.password,
  database: env.database.name,
  entities: [
    User,
    RefreshToken,
    Board,
    BoardList,
    Card,
    ChecklistItem,
    BoardMember,
    CardAssignee,
    Label,
    CardLabel,
    Comment,
  ],
  synchronize: true,
  logging: false,
});
