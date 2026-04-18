import { Hono } from "hono";

import { successResponse } from "../lib/http";

export function createHealthRouter(): Hono {
  const router = new Hono();

  router.get("/health", (context) => {
    return successResponse(context, {
      status: "ok",
      service: "evolith-server",
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
