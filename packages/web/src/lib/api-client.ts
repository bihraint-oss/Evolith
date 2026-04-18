import type {
  AnswerDiagnosisResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthResponse,
  AuthTokens,
  GetDiagnosisSessionResponse,
  GetProfileResponse,
  GetSkillsResponse,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
  StartDiagnosisResponse,
} from "@evolith/shared";

import {
  clearAuthTokens,
  loadAuthTokens,
  saveAuthTokens,
} from "./auth-session";

const API_BASE_PATH = "/api";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string | undefined;
    },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code;
  }
}

export interface ApiClientAuthSession {
  getTokens: () => AuthTokens | null;
  saveTokens: (tokens: AuthTokens) => void;
  clearTokens: () => void;
}

type RequestMethod = "GET" | "POST";

interface JsonRequestOptions<TBody> {
  path: string;
  method: RequestMethod;
  body?: TBody;
  requiresAuth?: boolean;
  retryOnUnauthorized?: boolean;
  accessToken?: string;
}

const defaultAuthSession: ApiClientAuthSession = {
  getTokens: () => loadAuthTokens(),
  saveTokens: (tokens) => {
    saveAuthTokens(tokens);
  },
  clearTokens: () => {
    clearAuthTokens();
  },
};

let authSession = defaultAuthSession;
let inFlightRefreshPromise: Promise<AuthTokens> | null = null;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiSuccessResponse<TData>(
  payload: unknown,
): payload is ApiSuccessResponse<TData> {
  return isObjectRecord(payload) && "data" in payload;
}

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  if (!isObjectRecord(payload) || !("error" in payload)) {
    return false;
  }

  const { error } = payload;

  return (
    isObjectRecord(error) &&
    typeof error.message === "string" &&
    ("code" in error ? typeof error.code === "string" : true)
  );
}

function createFallbackError(response: Response): ApiClientError {
  return new ApiClientError(
    response.statusText || "Request failed",
    { status: response.status },
  );
}

async function parseEnvelopeBody(response: Response): Promise<unknown> {
  const rawBody = await response.text();

  if (rawBody.length === 0) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

async function unwrapResponseData<TData>(response: Response): Promise<TData> {
  const payload = await parseEnvelopeBody(response);

  if (response.ok) {
    if (isApiSuccessResponse<TData>(payload)) {
      return payload.data;
    }

    throw createFallbackError(response);
  }

  if (isApiErrorResponse(payload)) {
    throw new ApiClientError(payload.error.message, {
      status: response.status,
      code: payload.error.code,
    });
  }

  throw createFallbackError(response);
}

function getStoredTokens(): AuthTokens {
  const tokens = authSession.getTokens();

  if (tokens !== null) {
    return tokens;
  }

  authSession.clearTokens();
  throw new ApiClientError("Authentication required", {
    status: 401,
    code: "auth_required",
  });
}

function createHeaders<TBody>(
  options: Pick<JsonRequestOptions<TBody>, "body" | "requiresAuth" | "accessToken">,
): Headers {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.requiresAuth) {
    const token = options.accessToken ?? getStoredTokens().accessToken;
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function sendJsonRequest<TBody>(
  options: JsonRequestOptions<TBody>,
): Promise<Response> {
  const requestInit: RequestInit = {
    method: options.method,
    headers: createHeaders(options),
  };

  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  return fetch(`${API_BASE_PATH}${options.path}`, {
    ...requestInit,
  });
}

async function refreshAuthTokens(): Promise<AuthTokens> {
  if (inFlightRefreshPromise !== null) {
    return inFlightRefreshPromise;
  }

  const currentTokens = getStoredTokens();

  inFlightRefreshPromise = (async () => {
    try {
      const response = await sendJsonRequest({
        path: "/auth/refresh",
        method: "POST",
        body: {
          refreshToken: currentTokens.refreshToken,
        },
      });
      const data = await unwrapResponseData<RefreshResponse>(response);

      authSession.saveTokens(data.tokens);
      return data.tokens;
    } catch (error) {
      authSession.clearTokens();
      throw error;
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
}

async function requestJson<TData, TBody = never>(
  options: JsonRequestOptions<TBody>,
): Promise<TData> {
  const response = await sendJsonRequest(options);

  if (
    options.requiresAuth === true &&
    options.retryOnUnauthorized !== false &&
    response.status === 401
  ) {
    const refreshedTokens = await refreshAuthTokens();

    return requestJson<TData, TBody>({
      ...options,
      accessToken: refreshedTokens.accessToken,
      retryOnUnauthorized: false,
    });
  }

  return unwrapResponseData<TData>(response);
}

export function configureApiClientAuthSession(
  overrides: Partial<ApiClientAuthSession>,
): void {
  authSession = {
    ...authSession,
    ...overrides,
  };
}

export function resetApiClientAuthSession(): void {
  authSession = defaultAuthSession;
  inFlightRefreshPromise = null;
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export async function register(
  payload: RegisterRequest,
): Promise<AuthResponse> {
  return requestJson<AuthResponse, RegisterRequest>({
    path: "/auth/register",
    method: "POST",
    body: payload,
  });
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  return requestJson<AuthResponse, LoginRequest>({
    path: "/auth/login",
    method: "POST",
    body: payload,
  });
}

export async function refresh(): Promise<RefreshResponse> {
  return {
    tokens: await refreshAuthTokens(),
  };
}

export async function getProfile(): Promise<GetProfileResponse> {
  return requestJson<GetProfileResponse>({
    path: "/profile",
    method: "GET",
    requiresAuth: true,
  });
}

export async function startDiagnosis(): Promise<StartDiagnosisResponse> {
  return requestJson<StartDiagnosisResponse, Record<string, never>>({
    path: "/profile/diagnosis/start",
    method: "POST",
    body: {},
    requiresAuth: true,
  });
}

export async function getDiagnosisSession(
  diagnosisSessionId: string,
): Promise<GetDiagnosisSessionResponse> {
  return requestJson<GetDiagnosisSessionResponse>({
    path: `/profile/diagnosis/${diagnosisSessionId}`,
    method: "GET",
    requiresAuth: true,
  });
}

export async function answerDiagnosis(
  diagnosisSessionId: string,
  choiceId: string,
): Promise<AnswerDiagnosisResponse> {
  return requestJson<
    AnswerDiagnosisResponse,
    {
      choiceId: string;
    }
  >({
    path: `/profile/diagnosis/${diagnosisSessionId}/answer`,
    method: "POST",
    body: { choiceId },
    requiresAuth: true,
  });
}

export async function getSkills(): Promise<GetSkillsResponse> {
  return requestJson<GetSkillsResponse>({
    path: "/skills",
    method: "GET",
    requiresAuth: true,
  });
}
