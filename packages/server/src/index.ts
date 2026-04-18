import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { createDatabaseClient } from "./db/client";
import { createTokenService } from "./lib/auth/tokens";
import { createLogger } from "./lib/logger";

const env = loadEnv();
const logger = createLogger();
const databaseClient = createDatabaseClient({
  databaseFile: env.DATABASE_FILE,
});
const tokenService = createTokenService({
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessTtl: env.JWT_ACCESS_TTL,
  refreshTtl: env.JWT_REFRESH_TTL,
});
const app = createApp({
  db: databaseClient.db,
  logger,
  tokenService,
});

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

logger.info(
  {
    event: "server.start_completed",
    port: env.PORT,
    environment: env.NODE_ENV,
  },
  `Server listening on http://localhost:${env.PORT}`,
);

export default server;
