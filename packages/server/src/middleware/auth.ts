import type { EntityId } from "@evolith/shared";
import type { Context, MiddlewareHandler } from "hono";
import type { Logger } from "pino";

import type { TokenService } from "../lib/auth/tokens";
import { InvalidAuthTokenError } from "../lib/auth/tokens";
import { errorResponse } from "../lib/http";

export interface AuthenticatedUser {
  userId: EntityId;
  email: string;
  tokenType: "access";
}

export interface AuthContextVariables {
  auth: AuthenticatedUser;
}

export interface AuthContextBindings {
  Variables: AuthContextVariables;
}

export interface AuthMiddlewareOptions {
  tokenService: Pick<TokenService, "verifyAccessToken">;
  logger?: Logger;
}

export function extractBearerToken(
  authorizationHeader: string | undefined,
): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token, ...rest] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
    return null;
  }

  return token;
}

export function createAuthMiddleware(
  options: AuthMiddlewareOptions,
): MiddlewareHandler<AuthContextBindings> {
  return async (context, next) => {
    const accessToken = extractBearerToken(
      context.req.header("Authorization"),
    );

    if (!accessToken) {
      return errorResponse(
        context,
        "Authentication required",
        401,
        "auth_required",
      );
    }

    try {
      const payload = await options.tokenService.verifyAccessToken(accessToken);

      context.set("auth", {
        userId: payload.sub,
        email: payload.email,
        tokenType: payload.type,
      });

      await next();
    } catch (error) {
      if (error instanceof InvalidAuthTokenError) {
        return errorResponse(context, "Invalid access token", 401, "invalid_token");
      }

      options.logger?.error(
        {
          event: "auth.middleware_error",
          error: error instanceof Error
            ? { name: error.name, message: error.message }
            : { message: String(error) },
        },
        "Unexpected error in auth middleware",
      );

      return errorResponse(context, "Invalid access token", 401, "invalid_token");
    }
  };
}

export function getAuthenticatedUser(
  context: Context<AuthContextBindings>,
): AuthenticatedUser {
  return context.get("auth");
}
