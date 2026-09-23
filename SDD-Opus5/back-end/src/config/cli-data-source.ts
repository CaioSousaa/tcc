import "dotenv/config";
import { parseEnv } from "./env";
import { createDataSource } from "./data-source";

// Entry point used by the TypeORM CLI (migration:run / migration:revert).
export default createDataSource(parseEnv(process.env));
