import type {
  AnswerDiagnosisRequest,
  AnswerDiagnosisResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthResponse,
  GetProfileResponse,
  GetSkillsResponse,
  LoginRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  StartDiagnosisResponse,
} from "@evolith/shared";

import { getErrorLogDetails, logErrorEvent } from "./logging";
import { sessionStore, type StoredSession } from "./session";

/**
 * Error code emitted when a token refresh confirms the session can no longer be reused.
 */
export const AUTH_EXPIRED_ERROR_CODE = "auth_expired";

/**
 * Represents a typed failure returned or synthesized by the web API client.
 */
export class ApiClientError extends Error {
  readonly code: string | undefined;
  readonly isAuthExpired: boolean;
  readonly status: number;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string | undefined;
      isAuthExpired?: boolean | undefined;
    },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code;
    this.isAuthExpired = options.isAuthExpired ?? false;
  }
}

/**
 * Describes the persistence hooks the API client uses for authenticated requests.
 */
export interface SessionStoreAdapter {
  getSession(): StoredSession | null;
  setSession(session: StoredSession): void;
  clearSession(): void;
}

/**
 * Configures the API client for runtime use or tests.
 */
export interface ApiClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  sessionStore?: SessionStoreAdapter;
}

interface RequestOptions<TBody> {
  auth?: boolean;
  body?: TBody;
  method?: "GET" | "POST";
  retryOnUnauthorized?: boolean;
}

function getApiBaseUrl(override: string | undefined): string {
  if (override !== undefined) {
    return override.replace(/\/+$/, "");
  }

  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  return (configuredBaseUrl ?? "/api").replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function isApiSuccessResponse<TData>(
  value: unknown,
): value is ApiSuccessResponse<TData> {
  return typeof value === "object" && value !== null && "data" in value;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }

  const error = value.error;

  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  );
}

async function parseEnvelope<TData>(response: Response): Promise<TData> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    logErrorEvent("api.parseEnvelope_error", {
      domain: "api",
      action: "parseEnvelope",
      state: "json_parse_failed",
      status: response.status,
      url: response.url,
      ...getErrorLogDetails(error),
    });
    throw new ApiClientError("The API returned an invalid JSON response.", {
      status: response.status,
    });
  }

  if (response.ok) {
    if (!isApiSuccessResponse<TData>(payload)) {
      logErrorEvent("api.parseEnvelope_invalid_success_payload", {
        domain: "api",
        action: "parseEnvelope",
        state: "invalid_success_payload",
        status: response.status,
        url: response.url,
      });
      throw new ApiClientError("The API returned an invalid success payload.", {
        status: response.status,
      });
    }

    return payload.data;
  }

  if (isApiErrorResponse(payload)) {
    logErrorEvent("api.parseEnvelope_api_error", {
      domain: "api",
      action: "parseEnvelope",
      state: "api_error",
      errorCode: payload.error.code,
      errorMessage: payload.error.message,
      status: response.status,
      url: response.url,
    });
    throw new ApiClientError(payload.error.message, {
      status: response.status,
      code: payload.error.code,
    });
  }

  logErrorEvent("api.parseEnvelope_invalid_error_payload", {
    domain: "api",
    action: "parseEnvelope",
    state: "invalid_error_payload",
    status: response.status,
    url: response.url,
  });
  throw new ApiClientError(`Request failed with status ${response.status}.`, {
    status: response.status,
  });
}

/**
 * Creates a typed client for the Evolith HTTP API with session refresh handling.
 */
export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = getApiBaseUrl(options.baseUrl);
  const storage = options.sessionStore ?? sessionStore;

  async function sendRequest<TData, TBody = undefined>(
    path: string,
    requestOptions: RequestOptions<TBody> = {},
  ): Promise<TData> {
    const {
      auth = false,
      body,
      method = "GET",
      retryOnUnauthorized = auth,
    } = requestOptions;

    const activeSession = storage.getSession();
    const headers = new Headers();

    headers.set("Accept", "application/json");

    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (auth && activeSession !== null) {
      headers.set(
        "Authorization",
        `${activeSession.tokenType} ${activeSession.accessToken}`,
      );
    }

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    let response: Response;

    try {
      const fetchImpl = options.fetch ?? fetch;
      response = await fetchImpl(buildUrl(baseUrl, path), requestInit);
    } catch (error) {
      logErrorEvent("api.sendRequest_error", {
        domain: "api",
        action: "sendRequest",
        state: "request_failed",
        method,
        path,
        url: buildUrl(baseUrl, path),
        ...getErrorLogDetails(error),
      });
      throw new ApiClientError("The API request could not be completed.", {
        status: 0,
      });
    }

    if (
      response.status === 401 &&
      auth &&
      retryOnUnauthorized &&
      activeSession !== null
    ) {
      const refreshedSession = await refreshSession(activeSession);

      if (refreshedSession === null) {
        throw new ApiClientError(
          "Your session has expired. Please sign in again.",
          {
            status: 401,
            code: AUTH_EXPIRED_ERROR_CODE,
            isAuthExpired: true,
          },
        );
      }

      const retryOptions: RequestOptions<TBody> = {
        auth,
        method,
        retryOnUnauthorized: false,
      };

      if (body !== undefined) {
        retryOptions.body = body;
      }

      return sendRequest<TData, TBody>(path, retryOptions);
    }

    return parseEnvelope<TData>(response);
  }

  async function refreshSession(
    activeSession: StoredSession,
  ): Promise<StoredSession | null> {
    try {
      const response = await sendRequest<RefreshResponse, RefreshRequest>(
        "/auth/refresh",
        {
          method: "POST",
          body: {
            refreshToken: activeSession.refreshToken,
          },
          retryOnUnauthorized: false,
        },
      );

      const nextSession: StoredSession = {
        ...activeSession,
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
        tokenType: response.tokens.tokenType,
      };

      storage.setSession(nextSession);

      return nextSession;
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        logErrorEvent("api.refreshSession_auth_expired", {
          domain: "api",
          action: "refreshSession",
          state: "auth_expired",
          ...getErrorLogDetails(error),
        });
        storage.clearSession();
        return null;
      }

      logErrorEvent("api.refreshSession_error", {
        domain: "api",
        action: "refreshSession",
        state: "request_failed",
        ...getErrorLogDetails(error),
      });
      throw error;
    }
  }

  return {
    answerDiagnosis(
      request: AnswerDiagnosisRequest,
    ): Promise<AnswerDiagnosisResponse> {
      return sendRequest<AnswerDiagnosisResponse, Pick<AnswerDiagnosisRequest, "choiceId">>(
        `/profile/diagnosis/${request.id}/answer`,
        {
          method: "POST",
          auth: true,
          body: { choiceId: request.choiceId },
        },
      );
    },
    getProfile(): Promise<GetProfileResponse> {
      return sendRequest<GetProfileResponse>("/profile", {
        auth: true,
      });
    },
    getSkills(): Promise<GetSkillsResponse> {
      return sendRequest<GetSkillsResponse>("/skills", {
        auth: true,
      });
    },
    login(request: LoginRequest): Promise<AuthResponse> {
      return sendRequest<AuthResponse, LoginRequest>("/auth/login", {
        method: "POST",
        body: request,
      });
    },
    refresh(request: RefreshRequest): Promise<RefreshResponse> {
      return sendRequest<RefreshResponse, RefreshRequest>("/auth/refresh", {
        method: "POST",
        body: request,
        retryOnUnauthorized: false,
      });
    },
    register(request: RegisterRequest): Promise<AuthResponse> {
      return sendRequest<AuthResponse, RegisterRequest>("/auth/register", {
        method: "POST",
        body: request,
      });
    },
    startDiagnosis(): Promise<StartDiagnosisResponse> {
      return sendRequest<StartDiagnosisResponse>("/profile/diagnosis/start", {
        method: "POST",
        auth: true,
      });
    },
  };
}

/**
 * Shared singleton API client for browser components.
 */
export const apiClient = createApiClient();

/**
 * Submits one answer for the active diagnosis session.
 */
export const answerDiagnosis = apiClient.answerDiagnosis;
/**
 * Loads the authenticated user's live profile and diagnosis state.
 */
export const getProfile = apiClient.getProfile;
/**
 * Loads the authored skill roadmap with user progress state.
 */
export const getSkills = apiClient.getSkills;
/**
 * Exchanges email credentials for a new authenticated session.
 */
export const login = apiClient.login;
/**
 * Exchanges a refresh token for a fresh access token pair.
 */
export const refresh = apiClient.refresh;
/**
 * Creates a new account and returns the initial authenticated session.
 */
export const register = apiClient.register;
/**
 * Starts or resumes the user's diagnosis flow.
 */
export const startDiagnosis = apiClient.startDiagnosis;
