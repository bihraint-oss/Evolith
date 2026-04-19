import type {
  AuthResponse,
  GetProfileResponse,
  PublicUser,
  RefreshResponse,
} from "@evolith/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_EXPIRED_ERROR_CODE,
  createApiClient,
} from "./api";
import { createStoredSession, sessionStore } from "./session";

const API_BASE_URL = "http://localhost:3000/api";

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createSuccessResponse<TData>(data: TData, status = 200): Response {
  return createJsonResponse({ data }, status);
}

function createErrorResponse(
  message: string,
  status: number,
  code?: string,
): Response {
  return createJsonResponse(
    {
      error: code ? { message, code } : { message },
    },
    status,
  );
}

const user: PublicUser = {
  id: "user-1",
  email: "ada@example.com",
  displayName: "Ada Lovelace",
  createdAt: "2026-04-19T00:00:00.000Z",
  updatedAt: "2026-04-19T00:00:00.000Z",
};

const authResponse: AuthResponse = {
  user,
  tokens: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    tokenType: "Bearer",
  },
};

const profileResponse: GetProfileResponse = {
  profile: {
    id: "profile-1",
    userId: user.id,
    creativity: 82,
    imagination: 76,
    promptPrecision: 91,
    systemDecomposition: 88,
    aiOrchestration: 79,
    lastDiagnosedAt: "2026-04-19T00:00:00.000Z",
    createdAt: "2026-04-19T00:00:00.000Z",
    updatedAt: "2026-04-19T00:00:00.000Z",
  },
  hasCompletedDiagnosis: true,
  lastDiagnosedAt: "2026-04-19T00:00:00.000Z",
  radar: [
    { dimension: "creativity", value: 82 },
    { dimension: "imagination", value: 76 },
    { dimension: "promptPrecision", value: 91 },
    { dimension: "systemDecomposition", value: 88 },
    { dimension: "aiOrchestration", value: 79 },
  ],
};

describe("createApiClient", () => {
  beforeEach(() => {
    sessionStore.clearSession();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("parses the standard success envelope for auth requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(authResponse, 201));
    const client = createApiClient({
      baseUrl: API_BASE_URL,
      fetch: fetchMock as typeof fetch,
    });

    const result = await client.login({
      email: "ada@example.com",
      password: "password123",
    });

    expect(result).toEqual(authResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/login`,
      expect.objectContaining({
        method: "POST",
      }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(requestInit.headers);

    expect(headers.get("Authorization")).toBeNull();
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(requestInit.body as string)).toEqual({
      email: "ada@example.com",
      password: "password123",
    });
  });

  it("attaches the stored bearer token to authenticated requests", async () => {
    sessionStore.setSession(createStoredSession(authResponse));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(profileResponse));
    const client = createApiClient({
      baseUrl: API_BASE_URL,
      fetch: fetchMock as typeof fetch,
    });

    await client.getProfile();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(requestInit.headers);

    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });

  it("refreshes tokens once after a 401 and retries the original request", async () => {
    sessionStore.setSession(createStoredSession(authResponse));

    const refreshedTokens: RefreshResponse = {
      tokens: {
        accessToken: "access-token-fresh",
        refreshToken: "refresh-token-fresh",
        tokenType: "Bearer",
      },
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createErrorResponse("Invalid access token", 401, "invalid_token"),
      )
      .mockResolvedValueOnce(createSuccessResponse(refreshedTokens))
      .mockResolvedValueOnce(createSuccessResponse(profileResponse));
    const client = createApiClient({
      baseUrl: API_BASE_URL,
      fetch: fetchMock as typeof fetch,
    });

    const result = await client.getProfile();

    expect(result).toEqual(profileResponse);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${API_BASE_URL}/auth/refresh`);

    const refreshRequestInit = fetchMock.mock.calls[1]?.[1] as RequestInit;

    expect(JSON.parse(refreshRequestInit.body as string)).toEqual({
      refreshToken: "refresh-token",
    });

    const retryRequestInit = fetchMock.mock.calls[2]?.[1] as RequestInit;
    const retryHeaders = new Headers(retryRequestInit.headers);

    expect(retryHeaders.get("Authorization")).toBe(
      "Bearer access-token-fresh",
    );
    expect(sessionStore.getSession()).toEqual({
      ...createStoredSession(authResponse),
      accessToken: "access-token-fresh",
      refreshToken: "refresh-token-fresh",
    });
  });

  it("does not retry more than once after refreshing the session", async () => {
    sessionStore.setSession(createStoredSession(authResponse));

    const refreshedTokens: RefreshResponse = {
      tokens: {
        accessToken: "access-token-fresh",
        refreshToken: "refresh-token-fresh",
        tokenType: "Bearer",
      },
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createErrorResponse("Invalid access token", 401, "invalid_token"),
      )
      .mockResolvedValueOnce(createSuccessResponse(refreshedTokens))
      .mockResolvedValueOnce(
        createErrorResponse("Invalid access token", 401, "invalid_token"),
      );
    const client = createApiClient({
      baseUrl: API_BASE_URL,
      fetch: fetchMock as typeof fetch,
    });

    await expect(client.getProfile()).rejects.toMatchObject({
      code: "invalid_token",
      isAuthExpired: false,
      status: 401,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws with status 0 when fetch fails before receiving a response", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const client = createApiClient({
      baseUrl: API_BASE_URL,
      fetch: fetchMock as typeof fetch,
    });

    await expect(
      client.login({
        email: "ada@example.com",
        password: "password123",
      }),
    ).rejects.toMatchObject({
      message: "The API request could not be completed.",
      status: 0,
    });
  });

  it("throws when the API returns a non-JSON response", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response("not json", {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }),
    );
    const client = createApiClient({
      baseUrl: API_BASE_URL,
      fetch: fetchMock as typeof fetch,
    });

    await expect(
      client.login({
        email: "ada@example.com",
        password: "password123",
      }),
    ).rejects.toMatchObject({
      message: "The API returned an invalid JSON response.",
      status: 200,
    });
  });

  it("throws when a success response payload is missing the data field", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      createJsonResponse({
        user,
        tokens: authResponse.tokens,
      }),
    );
    const client = createApiClient({
      baseUrl: API_BASE_URL,
      fetch: fetchMock as typeof fetch,
    });

    await expect(
      client.login({
        email: "ada@example.com",
        password: "password123",
      }),
    ).rejects.toMatchObject({
      message: "The API returned an invalid success payload.",
      status: 200,
    });
  });

  it("falls back to a generic message when the error envelope is malformed", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      createJsonResponse(
        {
          error: {
            code: "server_error",
          },
        },
        500,
      ),
    );
    const client = createApiClient({
      baseUrl: API_BASE_URL,
      fetch: fetchMock as typeof fetch,
    });

    await expect(
      client.login({
        email: "ada@example.com",
        password: "password123",
      }),
    ).rejects.toMatchObject({
      message: "Request failed with status 500.",
      status: 500,
    });
  });

  it("defaults the API base URL to /api when no override is provided", async () => {
    const env = import.meta.env as Record<string, string | undefined>;
    const hadConfiguredBaseUrl = Object.prototype.hasOwnProperty.call(
      env,
      "VITE_API_BASE_URL",
    );
    const originalBaseUrl = env.VITE_API_BASE_URL;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(authResponse, 201));

    delete env.VITE_API_BASE_URL;

    try {
      const client = createApiClient({
        fetch: fetchMock as typeof fetch,
      });

      await client.login({
        email: "ada@example.com",
        password: "password123",
      });

      expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/login");
    } finally {
      if (hadConfiguredBaseUrl) {
        env.VITE_API_BASE_URL = originalBaseUrl;
      } else {
        delete env.VITE_API_BASE_URL;
      }
    }
  });

  it("clears the stored session when refresh fails and throws auth expired", async () => {
    sessionStore.setSession(createStoredSession(authResponse));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createErrorResponse("Invalid access token", 401, "invalid_token"),
      )
      .mockResolvedValueOnce(
        createErrorResponse("Invalid refresh token", 401, "invalid_token"),
      );
    const client = createApiClient({
      baseUrl: API_BASE_URL,
      fetch: fetchMock as typeof fetch,
    });

    await expect(client.getProfile()).rejects.toMatchObject({
      code: AUTH_EXPIRED_ERROR_CODE,
      isAuthExpired: true,
      status: 401,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sessionStore.getSession()).toBeNull();
  });

  it("keeps the stored session when refresh fails with a retryable error", async () => {
    const storedSession = createStoredSession(authResponse);
    sessionStore.setSession(storedSession);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createErrorResponse("Invalid access token", 401, "invalid_token"),
      )
      .mockResolvedValueOnce(
        createErrorResponse("Refresh service unavailable", 503, "server_error"),
      );
    const client = createApiClient({
      baseUrl: API_BASE_URL,
      fetch: fetchMock as typeof fetch,
    });

    await expect(client.getProfile()).rejects.toMatchObject({
      code: "server_error",
      isAuthExpired: false,
      message: "Refresh service unavailable",
      status: 503,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sessionStore.getSession()).toEqual(storedSession);
  });
});
