import type {
  GetProfileResponse,
  GetSkillsResponse,
  PublicUser,
  SkillNodeView,
} from "@evolith/shared";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SESSION_STORAGE_KEY = "evolith.session";

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

const user: PublicUser = {
  id: "user-1",
  email: "ada@example.com",
  displayName: "Ada Lovelace",
  createdAt: "2026-04-19T00:00:00.000Z",
  updatedAt: "2026-04-19T00:00:00.000Z",
};

function createProfileResponse(
  hasCompletedDiagnosis: boolean,
): GetProfileResponse {
  return {
    profile: {
      id: "profile-1",
      userId: user.id,
      creativity: hasCompletedDiagnosis ? 82 : 0,
      imagination: hasCompletedDiagnosis ? 76 : 0,
      promptPrecision: hasCompletedDiagnosis ? 91 : 0,
      systemDecomposition: hasCompletedDiagnosis ? 88 : 0,
      aiOrchestration: hasCompletedDiagnosis ? 79 : 0,
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

const skills: SkillNodeView[] = [
  {
    id: "skill-1",
    name: "Prompt Remixing Foundations",
    description: "Learn the first layer of prompt adaptation.",
    dimension: "creativity",
    difficulty: 1,
    prerequisiteIds: [],
    completionCriteria: "Finish the foundation workflow.",
    createdAt: "2026-04-19T00:00:00.000Z",
    updatedAt: "2026-04-19T00:00:00.000Z",
    status: "available",
  },
];

function writeStoredSession(): void {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user,
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
    }),
  );
}

async function renderApp(options: {
  fetchMock: ReturnType<typeof vi.fn>;
  initialEntry?: string;
  withStoredSession?: boolean;
}) {
  vi.resetModules();
  localStorage.clear();

  if (options.withStoredSession) {
    writeStoredSession();
  }

  vi.stubGlobal("fetch", options.fetchMock);

  const [{ default: App }, { SessionProvider }, { MemoryRouter }] =
    await Promise.all([
      import("./App"),
      import("./lib/session"),
      import("react-router-dom"),
    ]);

  render(
    <SessionProvider>
      <MemoryRouter initialEntries={[options.initialEntry ?? "/"]}>
        <App />
      </MemoryRouter>
    </SessionProvider>,
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.unstubAllGlobals?.();
    localStorage.clear();
  });

  it("routes the landing path to /auth for unauthenticated visitors", async () => {
    const fetchMock = vi.fn();

    await renderApp({ fetchMock });

    expect(
      await screen.findByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks unauthenticated users from protected routes", async () => {
    const fetchMock = vi.fn();

    await renderApp({
      fetchMock,
      initialEntry: "/dashboard",
    });

    expect(
      await screen.findByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Redirecting to sign in")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bootstraps the session from localStorage before rendering protected routes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(true)))
      .mockResolvedValueOnce(
        createSuccessResponse<GetSkillsResponse>({ skills }),
      );

    await renderApp({
      fetchMock,
      initialEntry: "/dashboard",
      withStoredSession: true,
    });

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Your latest diagnosis signal",
      }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(requestInit.headers);

    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });
});
