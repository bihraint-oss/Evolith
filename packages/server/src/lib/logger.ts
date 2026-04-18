import type { MiddlewareHandler } from "hono";
import pino, { type Logger } from "pino";

export function createLogger(): Logger {
  return pino({
    level: "info",
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export function createRequestLogger(logger: Logger): MiddlewareHandler {
  return async (context, next) => {
    const startedAt = performance.now();

    try {
      await next();
    } finally {
      logger.info(
        {
          event: "http.request_completed",
          method: context.req.method,
          path: context.req.path,
          status: context.res.status,
          durationMs: Number((performance.now() - startedAt).toFixed(1)),
        },
        "Request completed",
      );
    }
  };
}
