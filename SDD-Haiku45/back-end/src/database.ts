import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Session } from "./entities/Session";
import { Board } from "./entities/Board";
import { BoardColumn } from "./entities/Column";
import { BoardMember } from "./entities/BoardMember";
import { Invitation } from "./entities/Invitation";
import { Card } from "./entities/Card";
import { CardAssignment } from "./entities/CardAssignment";
import { Label } from "./entities/Label";
import { CardLabel } from "./entities/CardLabel";
import { Comment } from "./entities/Comment";
import { Checklist } from "./entities/Checklist";
import { ChecklistItem } from "./entities/ChecklistItem";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "tcc_db",
  synchronize: false,
  logging: process.env.NODE_ENV !== "production",
  entities: [
    User,
    Session,
    Board,
    BoardColumn,
    BoardMember,
    Invitation,
    Card,
    CardAssignment,
    Label,
    CardLabel,
    Comment,
    Checklist,
    ChecklistItem,
  ],
  migrations: ["src/migrations/*.ts"],
});
