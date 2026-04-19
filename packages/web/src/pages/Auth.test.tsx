import type { AuthResponse, GetProfileResponse, PublicUser } from "@evolith/shared";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function createProfileResponse(
  hasCompletedDiagnosis: boolean,
): GetProfileResponse {
  return {
    profile: {
      id: "profile-1",
      userId: user.id,
      creativity: 82,
      imagination: 76,
      promptPrecision: 91,
      systemDecomposition: 88,
      aiOrchestration: 79,
      lastDiagnosedAt: hasCompletedDiagnosis
        ? "2026-04-19T00:00:00.000Z"
        : null,
      createdAt: "2026-04-19T00:00:00.000Z",
      updatedAt: "2026-04-19T00:00:00.000Z",
    },
    hasCompletedDiagnosis,
    lastDiagnosedAt: hasCompletedDiagnosis
      ? "2026-04-19T00:00:00.000Z"
      : null,
    radar: hasCompletedDiagnosis
      ? [
          { dimension: "creativity", value: 82 },
          { dimension: "imagination", value: 76 },
          { dimension: "promptPrecision", value: 91 },
          { dimension: "systemDecomposition", value: 88 },
          { dimension: "aiOrchestration", value: 79 },
        ]
      : null,
  };
}

async function renderAuthPage(options: {
  fetchMock: ReturnType<typeof vi.fn>;
  withStoredSession?: boolean;
}) {
  vi.resetModules?.();
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: options.fetchMock,
    writable: true,
  });

  const [
    { default: AuthPage },
    { SessionProvider, createStoredSession, sessionStore, SESSION_STORAGE_KEY },
    { MemoryRouter, Route, Routes },
  ] = await Promise.all([
    import("./Auth"),
    import("../lib/session"),
    import("react-router-dom"),
  ]);

  sessionStore.clearSession();

  if (options.withStoredSession) {
    sessionStore.setSession(createStoredSession(authResponse));
  }

  render(
    <SessionProvider>
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route element={<AuthPage />} path="/auth" />
          <Route element={<div>Diagnosis Page</div>} path="/diagnosis" />
          <Route element={<div>Dashboard Page</div>} path="/dashboard" />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );

  return {
    SESSION_STORAGE_KEY,
  };
}

describe("AuthPage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals?.();
  });

  it("routes a new registration to diagnosis after checking the profile", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(authResponse, 201))
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(false)));
    const userActions = userEvent.setup();
    const { SESSION_STORAGE_KEY } = await renderAuthPage({ fetchMock });

    await userActions.type(screen.getByLabelText("Display name"), "Ada Lovelace");
    await userActions.type(screen.getByLabelText("Email"), "ada@example.com");
    await userActions.type(screen.getByLabelText("Password"), "password123");
    await userActions.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Diagnosis Page")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/register");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/profile");

    const requestInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const headers = new Headers(requestInit.headers);

    expect(headers.get("Authorization")).toBe("Bearer access-token");
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();
  });

  it("routes login users with a completed diagnosis to the dashboard", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(authResponse))
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(true)));
    const userActions = userEvent.setup();

    await renderAuthPage({ fetchMock });

    await userActions.click(screen.getByRole("button", { name: "Log in" }));
    await userActions.type(screen.getByLabelText("Email"), "ada@example.com");
    await userActions.type(screen.getByLabelText("Password"), "password123");
    await userActions.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/login");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/profile");
  });

  it("shows the API error inline when credentials are rejected", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createErrorResponse("Invalid email or password", 401, "invalid_credentials"),
      );
    const userActions = userEvent.setup();

    await renderAuthPage({ fetchMock });

    await userActions.click(screen.getByRole("button", { name: "Log in" }));
    await userActions.type(screen.getByLabelText("Email"), "ada@example.com");
    await userActions.type(screen.getByLabelText("Password"), "bad-password");
    await userActions.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );
    expect(screen.queryByText("Dashboard Page")).not.toBeInTheDocument();
  });

  it("redirects away from /auth when a stored session already exists", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(true)));

    await renderAuthPage({
      fetchMock,
      withStoredSession: true,
    });

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(requestInit.headers);

    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });
});
