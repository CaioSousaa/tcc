import "reflect-metadata";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./database";
import { parseCookie, errorHandler } from "./middlewares";
import authRoutes from "./routes/auth";
import boardRoutes from "./routes/boards";
import columnRoutes from "./routes/columns";
import cardRoutes from "./routes/cards";
import memberRoutes from "./routes/members";
import invitationRoutes from "./routes/invitations";
import assignmentRoutes from "./routes/assignments";
import labelRoutes from "./routes/labels";
import commentRoutes from "./routes/comments";
import checklistRoutes from "./routes/checklist.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(parseCookie);

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/boards/:boardId/columns", columnRoutes);
app.use("/api/lists/:listId/cards", cardRoutes);
app.use("/api", memberRoutes);
app.use("/api", invitationRoutes);
app.use("/api", assignmentRoutes);
app.use("/api", labelRoutes);
app.use("/api", commentRoutes);
app.use("/api", checklistRoutes);

app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
    process.exit(1);
  });
