import type {
  AuthResponse,
  LoginRequest,
  PublicUser,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
} from "@evolith/shared";
import { and, eq } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { z } from "zod";

import type { AppDatabase } from "../db/client";
import { cognitiveProfiles, users } from "../db/schema";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import {
  type TokenIdentity,
  type TokenService,
  InvalidAuthTokenError,
} from "../lib/auth/tokens";
import { errorResponse, successResponse } from "../lib/http";

export interface AuthRouteDependencies {
  db: AppDatabase;
  tokenService: Pick<TokenService, "issueAuthTokens" | "verifyRefreshToken">;
}

const registerRequestSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(100),
}) satisfies z.ZodType<RegisterRequest>;

const loginRequestSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
}) satisfies z.ZodType<LoginRequest>;

const refreshRequestSchema = z.object({
  refreshToken: z.string().trim().min(1),
}) satisfies z.ZodType<RefreshRequest>;

type ParsedBodyResult<TData> =
  | { success: true; data: TData }
  | { success: false; response: Response };

type UserRecord = typeof users.$inferSelect;

function toValidationMessage(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "body";
      return `${field}: ${issue.message}`;
    })
    .join("; ");
}

async function parseJsonBody<TData>(
  context: Context,
  schema: z.ZodType<TData>,
): Promise<ParsedBodyResult<TData>> {
  let payload: unknown;

  try {
    payload = await context.req.json();
  } catch {
    return {
      success: false,
      response: errorResponse(
        context,
        "Malformed JSON request body",
        400,
        "invalid_json",
      ),
    };
  }

  const parsedPayload = schema.safeParse(payload);

  if (!parsedPayload.success) {
    return {
      success: false,
      response: errorResponse(
        context,
        `Invalid request body: ${toValidationMessage(parsedPayload.error)}`,
        400,
        "invalid_request_body",
      ),
    };
  }

  return {
    success: true,
    data: parsedPayload.data,
  };
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isDuplicateEmailError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("UNIQUE constraint failed: users.email") ||
    error.message.includes("users_email_unique")
  );
}

function findUserByEmail(db: AppDatabase, email: string): UserRecord | undefined {
  return db.select().from(users).where(eq(users.email, email)).get();
}

function findUserById(db: AppDatabase, userId: string): UserRecord | undefined {
  return db.select().from(users).where(eq(users.id, userId)).get();
}

function createTokenIdentity(user: UserRecord): TokenIdentity {
  return {
    userId: user.id,
    email: user.email,
  };
}

export function createAuthRouter(
  dependencies: AuthRouteDependencies,
): Hono {
  const router = new Hono();

  router.post("/auth/register", async (context) => {
    const parsedBody = await parseJsonBody(context, registerRequestSchema);

    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const { email, password, displayName } = parsedBody.data;

    if (findUserByEmail(dependencies.db, email)) {
      return errorResponse(
        context,
        "A user with that email already exists",
        409,
        "duplicate_email",
      );
    }

    const passwordHash = await hashPassword(password);

    try {
      const createdUser = dependencies.db.transaction((tx) => {
        const userId = crypto.randomUUID();
        const profileId = crypto.randomUUID();

        tx.insert(users)
          .values({
            id: userId,
            email,
            passwordHash,
            displayName,
          })
          .run();

        tx.insert(cognitiveProfiles)
          .values({
            id: profileId,
            userId,
          })
          .run();

        return tx
          .select()
          .from(users)
          .where(and(eq(users.id, userId), eq(users.email, email)))
          .get();
      });

      if (!createdUser) {
        throw new Error("Failed to load created user");
      }

      const tokens = await dependencies.tokenService.issueAuthTokens(
        createTokenIdentity(createdUser),
      );

      const response: AuthResponse = {
        user: toPublicUser(createdUser),
        tokens,
      };

      return successResponse(context, response, 201);
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        return errorResponse(
          context,
          "A user with that email already exists",
          409,
          "duplicate_email",
        );
      }

      throw error;
    }
  });

  router.post("/auth/login", async (context) => {
    const parsedBody = await parseJsonBody(context, loginRequestSchema);

    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const { email, password } = parsedBody.data;
    const user = findUserByEmail(dependencies.db, email);

    if (!user) {
      return errorResponse(
        context,
        "Invalid email or password",
        401,
        "invalid_credentials",
      );
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);

    if (!passwordMatches) {
      return errorResponse(
        context,
        "Invalid email or password",
        401,
        "invalid_credentials",
      );
    }

    const tokens = await dependencies.tokenService.issueAuthTokens(
      createTokenIdentity(user),
    );

    const response: AuthResponse = {
      user: toPublicUser(user),
      tokens,
    };

    return successResponse(context, response);
  });

  router.post("/auth/refresh", async (context) => {
    const parsedBody = await parseJsonBody(context, refreshRequestSchema);

    if (!parsedBody.success) {
      return parsedBody.response;
    }

    try {
      const payload = await dependencies.tokenService.verifyRefreshToken(
        parsedBody.data.refreshToken,
      );

      if (payload.type !== "refresh") {
        return errorResponse(context, "Invalid refresh token", 401, "invalid_token");
      }

      const user = findUserById(dependencies.db, payload.sub);

      if (!user) {
        return errorResponse(context, "Invalid refresh token", 401, "invalid_token");
      }

      const response: RefreshResponse = {
        tokens: await dependencies.tokenService.issueAuthTokens(
          createTokenIdentity(user),
        ),
      };

      return successResponse(context, response);
    } catch (error) {
      if (error instanceof InvalidAuthTokenError) {
        return errorResponse(context, "Invalid refresh token", 401, "invalid_token");
      }

      throw error;
    }
  });

  return router;
}
