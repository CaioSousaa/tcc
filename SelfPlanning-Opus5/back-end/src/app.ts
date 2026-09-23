import "reflect-metadata";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { routes } from "./routes";
import { errorHandler } from "./shared/middlewares/errorHandler";

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(routes);
app.use(errorHandler);
