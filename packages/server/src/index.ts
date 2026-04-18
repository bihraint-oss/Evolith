import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { createLogger } from "./lib/logger";

const env = loadEnv();
const logger = createLogger();
const app = createApp({ logger });

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
