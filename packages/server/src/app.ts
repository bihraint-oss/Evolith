import { Hono } from "hono";
import type { Logger } from "pino";

import type { AppDatabase } from "./db/client";
import type { TokenService } from "./lib/auth/tokens";
import { errorResponse } from "./lib/http";
import { createLogger, createRequestLogger } from "./lib/logger";
import { createAuthRouter } from "./routes/auth";
import { createHealthRouter } from "./routes/health";
import { createProfileRouter } from "./routes/profile";
import { createSkillsRouter } from "./routes/skills";

export interface AppDependencies {
  db?: AppDatabase;
  logger?: Logger;
  tokenService?: TokenService;
}

export function createApp(dependencies: AppDependencies = {}): Hono {
  const logger = dependencies.logger ?? createLogger();
  const app = new Hono();

  if (
    (dependencies.db === undefined) !==
    (dependencies.tokenService === undefined)
  ) {
    throw new Error(
      "createApp requires both db and tokenService to enable auth routes",
    );
  }

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

  if (dependencies.db !== undefined && dependencies.tokenService !== undefined) {
    app.route(
      "/api",
      createAuthRouter({
        db: dependencies.db,
        tokenService: dependencies.tokenService,
      }),
    );

    app.route(
      "/api",
      createProfileRouter({
        db: dependencies.db,
        tokenService: dependencies.tokenService,
      }),
    );

    app.route(
      "/api",
      createSkillsRouter({
        db: dependencies.db,
        tokenService: dependencies.tokenService,
      }),
    );
  }

  app.notFound((context) => {
    return errorResponse(context, "Route not found", 404, "not_found");
  });

  return app;
}
