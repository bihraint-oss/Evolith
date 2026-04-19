import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthResponse,
  RefreshResponse,
} from "@evolith/shared";
import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import pino from "pino";

import { createApp } from "./app";
import {
  type DatabaseClient,
  createDatabaseClient,
} from "./db/client";
import { runMigrations } from "./db/migrate";
import { cognitiveProfiles, users } from "./db/schema";
import { createTokenService } from "./lib/auth/tokens";

interface TestAppContext {
  app: ReturnType<typeof createApp>;
  dbClient: DatabaseClient;
  cleanup: () => void;
}

function createTestAppContext(): TestAppContext {
  const directory = mkdtempSync(join(tmpdir(), "evolith-app-test-"));
  const databaseFile = join(directory, "test.db");

  runMigrations({ databaseFile });

  const dbClient = createDatabaseClient({ databaseFile });
  const tokenService = createTokenService({
    accessSecret: "test-access-secret-1234567890",
    refreshSecret: "test-refresh-secret-1234567890",
    accessTtl: "15m",
    refreshTtl: "7d",
  });
  const app = createApp({
    db: dbClient.db,
    logger: pino({ enabled: false }),
    tokenService,
  });

  return {
    app,
    dbClient,
    cleanup: () => {
      dbClient.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

async function postJson(
  app: TestAppContext["app"],
  path: string,
  payload: unknown,
): Promise<Response> {
  return app.request(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function parseJson<TResponse>(response: Response): Promise<TResponse> {
  return (await response.json()) as TResponse;
}

async function registerUser(
  app: TestAppContext["app"],
  email = "test.user@example.com",
): Promise<ApiSuccessResponse<AuthResponse>> {
  const response = await postJson(app, "/api/auth/register", {
    email,
    password: "password123",
    displayName: "Test User",
  });

  expect(response.status).toBe(201);

  return parseJson<ApiSuccessResponse<AuthResponse>>(response);
}

describe("createApp auth smoke tests", () => {
  test("GET /api/health returns 200 with the standard data envelope", async () => {
    const context = createTestAppContext();

    try {
      const response = await context.app.request("/api/health");
      const body = await parseJson<
        ApiSuccessResponse<{
          service: string;
          status: string;
          timestamp: string;
        }>
      >(response);

      expect(response.status).toBe(200);
      expect(body.data.status).toBe("ok");
      expect(body.data.service).toBe("evolith-server");
      expect(typeof body.data.timestamp).toBe("string");
    } finally {
      context.cleanup();
    }
  });

  test("POST /api/auth/register creates a user and cognitive profile", async () => {
    const context = createTestAppContext();

    try {
      const body = await registerUser(context.app, "Test.User@Example.com");
      const storedUser = context.dbClient.db
        .select()
        .from(users)
        .where(eq(users.email, "test.user@example.com"))
        .get();

      expect(body.data.user.email).toBe("test.user@example.com");
      expect(typeof body.data.tokens.accessToken).toBe("string");
      expect(typeof body.data.tokens.refreshToken).toBe("string");

      if (!storedUser) {
        throw new Error("Expected registered user to exist in the database.");
      }

      const storedProfile = context.dbClient.db
        .select()
        .from(cognitiveProfiles)
        .where(eq(cognitiveProfiles.userId, storedUser.id))
        .get();

      expect(storedProfile).toBeDefined();
      expect(storedProfile?.creativity).toBe(0);
      expect(storedProfile?.imagination).toBe(0);
      expect(storedProfile?.promptPrecision).toBe(0);
      expect(storedProfile?.systemDecomposition).toBe(0);
      expect(storedProfile?.aiOrchestration).toBe(0);
    } finally {
      context.cleanup();
    }
  });

  test("POST /api/auth/register returns 409 for duplicate email addresses", async () => {
    const context = createTestAppContext();

    try {
      await registerUser(context.app);

      const response = await postJson(context.app, "/api/auth/register", {
        email: "TEST.USER@example.com",
        password: "password123",
        displayName: "Another User",
      });
      const body = await parseJson<ApiErrorResponse>(response);

      expect(response.status).toBe(409);
      expect(body.error.code).toBe("duplicate_email");
    } finally {
      context.cleanup();
    }
  });

  test("POST /api/auth/login returns tokens for valid credentials", async () => {
    const context = createTestAppContext();

    try {
      const registered = await registerUser(context.app);
      const response = await postJson(context.app, "/api/auth/login", {
        email: "TEST.USER@example.com",
        password: "password123",
      });
      const body = await parseJson<ApiSuccessResponse<AuthResponse>>(response);

      expect(response.status).toBe(200);
      expect(body.data.user.id).toBe(registered.data.user.id);
      expect(body.data.user.email).toBe("test.user@example.com");
      expect(typeof body.data.tokens.accessToken).toBe("string");
      expect(typeof body.data.tokens.refreshToken).toBe("string");
    } finally {
      context.cleanup();
    }
  });

  test("POST /api/auth/login returns 401 for invalid credentials", async () => {
    const context = createTestAppContext();

    try {
      await registerUser(context.app);

      const response = await postJson(context.app, "/api/auth/login", {
        email: "test.user@example.com",
        password: "wrong-password",
      });
      const body = await parseJson<ApiErrorResponse>(response);

      expect(response.status).toBe(401);
      expect(body.error.code).toBe("invalid_credentials");
    } finally {
      context.cleanup();
    }
  });

  test("POST /api/auth/refresh returns a new token pair for a valid refresh token", async () => {
    const context = createTestAppContext();

    try {
      const registered = await registerUser(context.app);
      const response = await postJson(context.app, "/api/auth/refresh", {
        refreshToken: registered.data.tokens.refreshToken,
      });
      const body = await parseJson<ApiSuccessResponse<RefreshResponse>>(response);

      expect(response.status).toBe(200);
      expect(body.data.tokens.tokenType).toBe("Bearer");
      expect(body.data.tokens.accessToken).not.toBe(
        registered.data.tokens.accessToken,
      );
      expect(body.data.tokens.refreshToken).not.toBe(
        registered.data.tokens.refreshToken,
      );
    } finally {
      context.cleanup();
    }
  });

  test("POST /api/auth/refresh rejects access tokens", async () => {
    const context = createTestAppContext();

    try {
      const registered = await registerUser(context.app);
      const response = await postJson(context.app, "/api/auth/refresh", {
        refreshToken: registered.data.tokens.accessToken,
      });
      const body = await parseJson<ApiErrorResponse>(response);

      expect(response.status).toBe(401);
      expect(body.error.code).toBe("invalid_token");
    } finally {
      context.cleanup();
    }
  });

  test("POST /api/auth/refresh rejects malformed tokens", async () => {
    const context = createTestAppContext();

    try {
      const response = await postJson(context.app, "/api/auth/refresh", {
        refreshToken: "not-a-jwt",
      });
      const body = await parseJson<ApiErrorResponse>(response);

      expect(response.status).toBe(401);
      expect(body.error.code).toBe("invalid_token");
    } finally {
      context.cleanup();
    }
  });

  test("CORS headers are present on cross-origin request", async () => {
    const context = createTestAppContext();

    try {
      const response = await context.app.request("/api/health", {
        method: "GET",
        headers: {
          "Origin": "http://localhost:5173",
        },
      });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:5173",
      );
      expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
        "true",
      );
    } finally {
      context.cleanup();
    }
  });

  test("CORS preflight OPTIONS request succeeds", async () => {
    const context = createTestAppContext();

    try {
      const response = await context.app.request("/api/health", {
        method: "OPTIONS",
        headers: {
          "Origin": "http://localhost:5173",
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "content-type",
        },
      });

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:5173",
      );
      expect(response.headers.get("Access-Control-Allow-Methods")).toBeDefined();
    } finally {
      context.cleanup();
    }
  });
});
