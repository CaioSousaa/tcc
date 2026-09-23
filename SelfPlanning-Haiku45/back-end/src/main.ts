import "reflect-metadata";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./database";
import authRoutes from "./routes/auth";
import boardRoutes from "./routes/boards";
import listsRoutes from "./routes/lists";
import cardsRoutes from "./routes/cards";
import checklistItemsRoutes from "./routes/checklist-items";
import boardMembersRoutes from "./routes/board-members";
import cardAssigneesRoutes from "./routes/card-assignees";
import labelsRoutes from "./routes/labels";
import cardLabelsRoutes from "./routes/card-labels";
import commentsRoutes from "./routes/comments";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);
app.use("/boards", boardRoutes);
app.use("/boards/:boardId/members", boardMembersRoutes);
app.use("/boards/:boardId/labels", labelsRoutes);
app.use("/boards/:boardId/lists", listsRoutes);
app.use("/boards/:boardId/lists/:listId/cards", cardsRoutes);
app.use("/boards/:boardId/lists/:listId/cards/:cardId/checklist-items", checklistItemsRoutes);
app.use("/boards/:boardId/lists/:listId/cards/:cardId/assignees", cardAssigneesRoutes);
app.use("/boards/:boardId/lists/:listId/cards/:cardId/labels", cardLabelsRoutes);
app.use("/boards/:boardId/lists/:listId/cards/:cardId/comments", commentsRoutes);

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    app.listen(3333, () => {
      console.log("Server running on port 3333");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
