import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./config/env";
import { Board } from "./entities/Board";
import { BoardMember } from "./entities/BoardMember";
import { Card } from "./entities/Card";
import { CardAssignee } from "./entities/CardAssignee";
import { CardLabel } from "./entities/CardLabel";
import { ChecklistItem } from "./entities/ChecklistItem";
import { Comment } from "./entities/Comment";
import { Label } from "./entities/Label";
import { List } from "./entities/List";
import { RefreshToken } from "./entities/RefreshToken";
import { User } from "./entities/User";

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
    BoardMember,
    List,
    Card,
    CardAssignee,
    ChecklistItem,
    Label,
    CardLabel,
    Comment,
  ],
  synchronize: !env.isProduction,
  logging: false,
});
