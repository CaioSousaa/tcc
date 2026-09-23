import "reflect-metadata";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { AppDataSource } from "./config/data-source";
import { authRoutes } from "./routes/auth.routes";
import { boardRoutes } from "./routes/board.routes";
import { listRoutes } from "./routes/list.routes";
import { cardsInListRoutes, cardDetailRoutes } from "./routes/card.routes";
import { checklistRoutes } from "./routes/checklist.routes";
import { boardMemberRoutes } from "./routes/board-member.routes";
import { cardAssigneeRoutes } from "./routes/card-assignee.routes";
import { labelRoutes } from "./routes/label.routes";
import { cardLabelRoutes } from "./routes/card-label.routes";
import { commentRoutes } from "./routes/comment.routes";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/boards", boardRoutes);
app.use("/boards/:boardId/lists", listRoutes);
app.use("/boards/:boardId/lists/:listId/cards", cardsInListRoutes);
app.use("/boards/:boardId/cards", cardDetailRoutes);
app.use("/boards/:boardId/cards/:cardId/checklist-items", checklistRoutes);
app.use("/boards/:boardId/members", boardMemberRoutes);
app.use("/boards/:boardId/cards/:cardId/assignees", cardAssigneeRoutes);
app.use("/boards/:boardId/labels", labelRoutes);
app.use("/boards/:boardId/cards/:cardId/labels", cardLabelRoutes);
app.use("/boards/:boardId/cards/:cardId/comments", commentRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "Erro interno do servidor" });
});

const PORT = Number(process.env.PORT ?? 3333);

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize data source", error);
    process.exit(1);
  });
