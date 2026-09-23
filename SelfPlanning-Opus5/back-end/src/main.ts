import { app } from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./database/data-source";

async function start(): Promise<void> {
  await AppDataSource.initialize();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
