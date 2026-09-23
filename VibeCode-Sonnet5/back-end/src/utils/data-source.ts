import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";
import { Board } from "../entities/Board";
import { List } from "../entities/List";
import { Card } from "../entities/Card";
import { ChecklistItem } from "../entities/ChecklistItem";
import { BoardMember } from "../entities/BoardMember";
import { CardAssignee } from "../entities/CardAssignee";
import { Label } from "../entities/Label";
import { CardLabel } from "../entities/CardLabel";
import { Comment } from "../entities/Comment";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.POSTGRES_USER as string,
  password: process.env.POSTGRES_PASSWORD as string,
  database: process.env.POSTGRES_DB as string,
  synchronize: true,
  logging: false,
  entities: [
    User,
    RefreshToken,
    Board,
    List,
    Card,
    ChecklistItem,
    BoardMember,
    CardAssignee,
    Label,
    CardLabel,
    Comment,
  ],
});
