import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { AppDataSource } from "./database";
import authRoutes from "./routes/authRoutes";
import boardRoutes from "./routes/boardRoutes";
import listRoutes from "./routes/listRoutes";
import cardRoutes from "./routes/cardRoutes";
import checklistRoutes from "./routes/checklistRoutes";
import memberRoutes from "./routes/memberRoutes";
import assigneeRoutes from "./routes/assigneeRoutes";
import labelRoutes from "./routes/labelRoutes";
import commentRoutes from "./routes/commentRoutes";

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/assignees", assigneeRoutes);
app.use("/api/labels", labelRoutes);
app.use("/api/comments", commentRoutes);

app.listen(3333, () => {
  console.log("Server running on port 3333");
});
