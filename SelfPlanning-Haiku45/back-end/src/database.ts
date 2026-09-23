import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Board } from "./entities/Board";
import { List } from "./entities/List";
import { Card } from "./entities/Card";
import { ChecklistItem } from "./entities/ChecklistItem";
import { BoardMember } from "./entities/BoardMember";
import { CardAssignee } from "./entities/CardAssignee";
import { Label } from "./entities/Label";
import { CardLabel } from "./entities/CardLabel";
import { Comment } from "./entities/Comment";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "tcc_db",
  synchronize: true,
  logging: true,
  entities: [User, Board, List, Card, ChecklistItem, BoardMember, CardAssignee, Label, CardLabel, Comment],
});
