import "reflect-metadata";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { AppDataSource } from "./utils/data-source";
import { authRouter } from "./routes/auth.routes";
import { boardRouter } from "./routes/board.routes";
import { listRouter } from "./routes/list.routes";
import { cardRouter } from "./routes/card.routes";
import { checklistItemRouter } from "./routes/checklist-item.routes";
import { boardMemberRouter } from "./routes/board-member.routes";
import { cardAssigneeRouter } from "./routes/card-assignee.routes";
import { labelRouter } from "./routes/label.routes";
import { cardLabelRouter } from "./routes/card-label.routes";
import { commentRouter } from "./routes/comment.routes";

const app = express();
const PORT = Number(process.env.PORT ?? 3333);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/boards", boardRouter);
app.use("/api/boards/:boardId/lists", listRouter);
app.use("/api/boards/:boardId/cards", cardRouter);
app.use(
  "/api/boards/:boardId/cards/:cardId/checklist-items",
  checklistItemRouter,
);
app.use("/api/boards/:boardId/members", boardMemberRouter);
app.use(
  "/api/boards/:boardId/cards/:cardId/assignees",
  cardAssigneeRouter,
);
app.use("/api/boards/:boardId/labels", labelRouter);
app.use(
  "/api/boards/:boardId/cards/:cardId/labels",
  cardLabelRouter,
);
app.use(
  "/api/boards/:boardId/cards/:cardId/comments",
  commentRouter,
);

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database connection", error);
    process.exit(1);
  });
