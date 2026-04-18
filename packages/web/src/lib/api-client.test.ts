import type {
  AuthResponse,
  AuthTokens,
  GetProfileResponse,
  GetSkillsResponse,
} from "@evolith/shared";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  ApiClientError,
  configureApiClientAuthSession,
  getProfile,
  login,
  resetApiClientAuthSession,
} from "./api-client";

interface MockRequest {
  url: string;
  method: string;
  headers: Headers;
  body: string | null;
}

const initialTokens: AuthTokens = {
  accessToken: "access-token-initial",
  refreshToken: "refresh-token-initial",
  tokenType: "Bearer",
};

const refreshedTokens: AuthTokens = {
  accessToken: "access-token-refreshed",
  refreshToken: "refresh-token-refreshed",
  tokenType: "Bearer",
};

const profileResponse: GetProfileResponse = {
  profile: {
    id: "profile-1",
    userId: "user-1",
    creativity: 61,
    imagination: 64,
    promptPrecision: 72,
    systemDecomposition: 68,
    aiOrchestration: 70,
    lastDiagnosedAt: "2026-04-19T10:00:00.000Z",
    createdAt: "2026-04-19T09:00:00.000Z",
    updatedAt: "2026-04-19T10:00:00.000Z",
  },
  hasCompletedDiagnosis: true,
  lastDiagnosedAt: "2026-04-19T10:00:00.000Z",
  radar: [
    { dimension: "creativity", value: 61 },
    { dimension: "imagination", value: 64 },
    { dimension: "promptPrecision", value: 72 },
    { dimension: "systemDecomposition", value: 68 },
    { dimension: "aiOrchestration", value: 70 },
  ],
};

const authResponse: AuthResponse = {
  user: {
    id: "user-1",
    email: "user@example.com",
    displayName: "Test User",
    createdAt: "2026-04-19T09:00:00.000Z",
    updatedAt: "2026-04-19T09:00:00.000Z",
  },
  tokens: initialTokens,
};

const originalFetch = globalThis.fetch;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function installFetchMock(
  handler: (request: MockRequest) => Response | Promise<Response>,
): MockRequest[] {
  const requests: MockRequest[] = [];

  globalThis.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request: MockRequest = {
      url:
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url,
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : null,
    };

    requests.push(request);

    return handler(request);
  }) as typeof fetch;

  return requests;
}

function expectApiClientError(
  error: unknown,
  expected: {
    message: string;
    status: number;
    code?: string | undefined;
  },
): void {
  expect(error).toBeInstanceOf(ApiClientError);

  const apiError = error as ApiClientError;

  expect(apiError.message).toBe(expected.message);
  expect(apiError.status).toBe(expected.status);
  expect(apiError.code).toBe(expected.code);
}

describe("api client", () => {
  beforeEach(() => {
    resetApiClientAuthSession();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetApiClientAuthSession();
  });

  test("unwraps { data } envelopes for public auth requests", async () => {
    const requests = installFetchMock((request) => {
      expect(request.url).toBe("/api/auth/login");
      expect(request.method).toBe("POST");

      return jsonResponse(200, { data: authResponse });
    });

    const result = await login({
      email: "user@example.com",
      password: "password123",
    });

    expect(result).toEqual(authResponse);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.headers.get("Content-Type")).toBe("application/json");
    expect(requests[0]?.headers.get("Accept")).toBe("application/json");
  });

  test("throws structured ApiClientError instances for { error } envelopes", async () => {
    installFetchMock(() =>
      jsonResponse(401, {
        error: {
          message: "Invalid email or password.",
          code: "invalid_credentials",
        },
      }),
    );

    let capturedError: unknown = null;

    try {
      await login({
        email: "user@example.com",
        password: "wrong-password",
      });
    } catch (error) {
      capturedError = error;
    }

    expectApiClientError(capturedError, {
      message: "Invalid email or password.",
      status: 401,
      code: "invalid_credentials",
    });
  });

  test("attaches a Bearer token to protected requests", async () => {
    configureApiClientAuthSession({
      getTokens: () => initialTokens,
      saveTokens: () => {},
      clearTokens: () => {},
    });

    const requests = installFetchMock(() =>
      jsonResponse(200, { data: profileResponse }),
    );

    const result = await getProfile();

    expect(result).toEqual(profileResponse);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.headers.get("Authorization")).toBe(
      `Bearer ${initialTokens.accessToken}`,
    );
  });

  test("refreshes once on a protected 401, stores new tokens, and retries the request", async () => {
    let currentTokens: AuthTokens | null = initialTokens;
    const savedTokens: AuthTokens[] = [];
    let clearCount = 0;

    configureApiClientAuthSession({
      getTokens: () => currentTokens,
      saveTokens: (tokens) => {
        currentTokens = tokens;
        savedTokens.push(tokens);
      },
      clearTokens: () => {
        currentTokens = null;
        clearCount += 1;
      },
    });

    const requests = installFetchMock((request) => {
      const authorization = request.headers.get("Authorization");

      if (
        request.url === "/api/profile" &&
        authorization === `Bearer ${initialTokens.accessToken}`
      ) {
        return jsonResponse(401, {
          error: {
            message: "Access token expired.",
            code: "token_expired",
          },
        });
      }

      if (request.url === "/api/auth/refresh") {
        expect(JSON.parse(request.body ?? "null")).toEqual({
          refreshToken: initialTokens.refreshToken,
        });

        return jsonResponse(200, {
          data: {
            tokens: refreshedTokens,
          },
        });
      }

      if (
        request.url === "/api/profile" &&
        authorization === `Bearer ${refreshedTokens.accessToken}`
      ) {
        return jsonResponse(200, { data: profileResponse });
      }

      throw new Error(`Unexpected request: ${request.method} ${request.url}`);
    });

    const result = await getProfile();

    expect(result).toEqual(profileResponse);
    expect(savedTokens).toEqual([refreshedTokens]);
    expect(clearCount).toBe(0);
    expect(currentTokens).toEqual(refreshedTokens);
    expect(requests.map((request) => request.url)).toEqual([
      "/api/profile",
      "/api/auth/refresh",
      "/api/profile",
    ]);
    expect(requests[2]?.headers.get("Authorization")).toBe(
      `Bearer ${refreshedTokens.accessToken}`,
    );
  });

  test("clears auth state when refresh fails", async () => {
    let currentTokens: AuthTokens | null = initialTokens;
    const savedTokens: AuthTokens[] = [];
    let clearCount = 0;

    configureApiClientAuthSession({
      getTokens: () => currentTokens,
      saveTokens: (tokens) => {
        currentTokens = tokens;
        savedTokens.push(tokens);
      },
      clearTokens: () => {
        currentTokens = null;
        clearCount += 1;
      },
    });

    installFetchMock((request) => {
      if (request.url === "/api/profile") {
        return jsonResponse(401, {
          error: {
            message: "Access token expired.",
            code: "token_expired",
          },
        });
      }

      if (request.url === "/api/auth/refresh") {
        return jsonResponse(401, {
          error: {
            message: "Refresh token expired.",
            code: "refresh_expired",
          },
        });
      }

      throw new Error(`Unexpected request: ${request.method} ${request.url}`);
    });

    let capturedError: unknown = null;

    try {
      await getProfile();
    } catch (error) {
      capturedError = error;
    }

    expectApiClientError(capturedError, {
      message: "Refresh token expired.",
      status: 401,
      code: "refresh_expired",
    });
    expect(savedTokens).toEqual([]);
    expect(clearCount).toBe(1);
    expect(currentTokens).toBeNull();
  });
});
