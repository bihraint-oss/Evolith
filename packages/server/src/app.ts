import { Hono } from "hono";
import type { Logger } from "pino";

import { errorResponse } from "./lib/http";
import { createLogger, createRequestLogger } from "./lib/logger";
import { createHealthRouter } from "./routes/health";

export interface AppDependencies {
  db?: unknown;
  logger?: Logger;
}

export function createApp(dependencies: AppDependencies = {}): Hono {
  const logger = dependencies.logger ?? createLogger();
  const app = new Hono();

  app.use("*", createRequestLogger(logger));

  app.onError((error, context) => {
    logger.error(
      {
        event: "http.request_failed",
        method: context.req.method,
        path: context.req.path,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : { message: String(error) },
      },
      "Unhandled request error",
    );

    return errorResponse(
      context,
      "Internal server error",
      500,
      "internal_error",
    );
  });

  app.route("/api", createHealthRouter());

  app.notFound((context) => {
    return errorResponse(context, "Route not found", 404, "not_found");
  });

  return app;
}
