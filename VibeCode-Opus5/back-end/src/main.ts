/// <reference path="./types/express.d.ts" />
import "reflect-metadata";
import { app } from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./data-source";

async function bootstrap() {
  await AppDataSource.initialize();
  console.log("Database connected");

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
