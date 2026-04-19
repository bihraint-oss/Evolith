import type {
  AnswerDiagnosisResponse,
  AuthResponse,
  DiagnosisQuestion,
  GetProfileResponse,
  InProgressDiagnosisSessionView,
  PublicUser,
} from "@evolith/shared";
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

const questionOne: DiagnosisQuestion = {
  id: "diagnosis-q1",
  prompt: "When an AI output misses the mark, what do you do first?",
  choices: [
    {
      id: "staged-flow",
      label: "Break the task into a clearer staged flow.",
    },
    {
      id: "contrast-explore",
      label: "Ask for contrasting options to widen the search.",
    },
  ],
};

const questionTwo: DiagnosisQuestion = {
  id: "diagnosis-q2",
  prompt: "How do you hand off a complex task to AI systems?",
  choices: [
    {
      id: "system-map",
      label: "Map the system and define the interfaces first.",
    },
    {
      id: "single-shot",
      label: "Try a single large prompt and iterate afterward.",
    },
  ],
};

const questionThree: DiagnosisQuestion = {
  id: "diagnosis-q3",
  prompt: "What is your default approach when a project has many unknowns?",
  choices: [
    {
      id: "discovery-branches",
      label: "Run multiple discovery branches before committing.",
    },
    {
      id: "straight-line",
      label: "Pick one path early and stay with it.",
    },
  ],
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

function createInProgressSession(options: {
  answeredQuestions: number;
  completionPercentage: number;
  currentQuestion: DiagnosisQuestion;
  id?: string;
  totalQuestions?: number;
}): InProgressDiagnosisSessionView {
  const totalQuestions = options.totalQuestions ?? 6;

  return {
    id: options.id ?? "session-1",
    state: "inProgress",
    progress: {
      totalQuestions,
      answeredQuestions: options.answeredQuestions,
      remainingQuestions: totalQuestions - options.answeredQuestions,
      completionPercentage: options.completionPercentage,
    },
    currentQuestion: options.currentQuestion,
    result: null,
    completedAt: null,
    createdAt: "2026-04-19T00:00:00.000Z",
    updatedAt: "2026-04-19T00:00:00.000Z",
  };
}

async function renderDiagnosisPage(options: {
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
    { default: DiagnosisPage },
    { SessionProvider, createStoredSession, sessionStore },
    { MemoryRouter, Route, Routes },
  ] = await Promise.all([
    import("./Diagnosis"),
    import("../lib/session"),
    import("react-router-dom"),
  ]);

  sessionStore.clearSession();

  if (options.withStoredSession ?? true) {
    sessionStore.setSession(createStoredSession(authResponse));
  }

  render(
    <SessionProvider>
      <MemoryRouter initialEntries={["/diagnosis"]}>
        <Routes>
          <Route element={<DiagnosisPage />} path="/diagnosis" />
          <Route element={<div>Dashboard Page</div>} path="/dashboard" />
          <Route element={<div>Auth Page</div>} path="/auth" />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

describe("DiagnosisPage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals?.();
  });

  it("starts a new diagnosis session after confirming the profile is incomplete", async () => {
    const session = createInProgressSession({
      answeredQuestions: 0,
      completionPercentage: 0,
      currentQuestion: questionOne,
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(false)))
      .mockResolvedValueOnce(createSuccessResponse({ session }, 201));

    await renderDiagnosisPage({ fetchMock });

    expect(
      await screen.findByText(questionOne.prompt),
    ).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 6")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/profile");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/profile/diagnosis/start");

    const requestInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const headers = new Headers(requestInit.headers);

    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });

  it("resumes the current in-progress diagnosis session returned by start", async () => {
    const resumedSession = createInProgressSession({
      answeredQuestions: 2,
      completionPercentage: 33,
      currentQuestion: questionThree,
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(false)))
      .mockResolvedValueOnce(createSuccessResponse({ session: resumedSession }));

    await renderDiagnosisPage({ fetchMock });

    expect(
      await screen.findByText(questionThree.prompt),
    ).toBeInTheDocument();
    expect(screen.getByText("Question 3 of 6")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("submits answers sequentially and redirects to the dashboard on completion", async () => {
    const startedSession = createInProgressSession({
      answeredQuestions: 0,
      completionPercentage: 0,
      currentQuestion: questionOne,
    });
    const advancedSession: AnswerDiagnosisResponse = {
      session: createInProgressSession({
        answeredQuestions: 1,
        completionPercentage: 17,
        currentQuestion: questionTwo,
      }),
    };
    const completedSession: AnswerDiagnosisResponse = {
      session: {
        id: "session-1",
        state: "completed",
        progress: {
          totalQuestions: 6,
          answeredQuestions: 6,
          remainingQuestions: 0,
          completionPercentage: 100,
        },
        currentQuestion: null,
        result: {
          scores: {
            creativity: 82,
            imagination: 76,
            promptPrecision: 91,
            systemDecomposition: 88,
            aiOrchestration: 79,
          },
          radar: [
            { dimension: "creativity", value: 82 },
            { dimension: "imagination", value: 76 },
            { dimension: "promptPrecision", value: 91 },
            { dimension: "systemDecomposition", value: 88 },
            { dimension: "aiOrchestration", value: 79 },
          ],
        },
        completedAt: "2026-04-19T00:00:00.000Z",
        createdAt: "2026-04-19T00:00:00.000Z",
        updatedAt: "2026-04-19T00:00:00.000Z",
      },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(false)))
      .mockResolvedValueOnce(createSuccessResponse({ session: startedSession }, 201))
      .mockResolvedValueOnce(createSuccessResponse(advancedSession))
      .mockResolvedValueOnce(createSuccessResponse(completedSession));
    const userActions = userEvent.setup();

    await renderDiagnosisPage({ fetchMock });

    await screen.findByText(questionOne.prompt);
    await userActions.click(
      screen.getByLabelText(questionOne.choices[0]?.label ?? ""),
    );
    await userActions.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText(questionTwo.prompt)).toBeInTheDocument();

    const firstAnswerRequest = fetchMock.mock.calls[2];
    expect(firstAnswerRequest?.[0]).toBe("/api/profile/diagnosis/session-1/answer");
    expect(JSON.parse((firstAnswerRequest?.[1] as RequestInit).body as string)).toEqual({
      choiceId: "staged-flow",
    });

    await userActions.click(
      screen.getByLabelText(questionTwo.choices[0]?.label ?? ""),
    );
    await userActions.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("redirects completed users away from diagnosis before starting a session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(true)));

    await renderDiagnosisPage({ fetchMock });

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/profile");
  });
});
