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

import { sessionStore, type StoredSession } from "./session";

export const AUTH_EXPIRED_ERROR_CODE = "auth_expired";

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

export interface SessionStoreAdapter {
  getSession(): StoredSession | null;
  setSession(session: StoredSession): void;
  clearSession(): void;
}

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
  } catch {
    throw new ApiClientError("The API returned an invalid JSON response.", {
      status: response.status,
    });
  }

  if (response.ok) {
    if (!isApiSuccessResponse<TData>(payload)) {
      throw new ApiClientError("The API returned an invalid success payload.", {
        status: response.status,
      });
    }

    return payload.data;
  }

  if (isApiErrorResponse(payload)) {
    throw new ApiClientError(payload.error.message, {
      status: response.status,
      code: payload.error.code,
    });
  }

  throw new ApiClientError(`Request failed with status ${response.status}.`, {
    status: response.status,
  });
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = getApiBaseUrl(options.baseUrl);
  const fetchImpl = options.fetch ?? fetch;
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
      response = await fetchImpl(buildUrl(baseUrl, path), requestInit);
    } catch {
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
    } catch {
      storage.clearSession();
      return null;
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

export const apiClient = createApiClient();

export const answerDiagnosis = apiClient.answerDiagnosis;
export const getProfile = apiClient.getProfile;
export const getSkills = apiClient.getSkills;
export const login = apiClient.login;
export const refresh = apiClient.refresh;
export const register = apiClient.register;
export const startDiagnosis = apiClient.startDiagnosis;
