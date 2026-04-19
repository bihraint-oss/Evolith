import type {
  AuthResponse,
  GetProfileResponse,
  GetSkillsResponse,
  PublicUser,
  SkillNodeView,
} from "@evolith/shared";
import { render, screen, within } from "@testing-library/react";
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

function createSkill(skill: Partial<SkillNodeView> & Pick<SkillNodeView, "id" | "name" | "status">): SkillNodeView {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description ?? `${skill.name} description`,
    dimension: skill.dimension ?? "creativity",
    difficulty: skill.difficulty ?? 1,
    prerequisiteIds: skill.prerequisiteIds ?? [],
    completionCriteria: skill.completionCriteria ?? `Complete ${skill.name}`,
    createdAt: skill.createdAt ?? "2026-04-19T00:00:00.000Z",
    updatedAt: skill.updatedAt ?? "2026-04-19T00:00:00.000Z",
    status: skill.status,
  };
}

const authoredSkills: SkillNodeView[] = [
  createSkill({
    id: "skill-3",
    name: "Workflow Step Decomposition",
    status: "inProgress",
    dimension: "systemDecomposition",
    difficulty: 2,
    prerequisiteIds: ["skill-1"],
  }),
  createSkill({
    id: "skill-1",
    name: "Prompt Remixing Foundations",
    status: "available",
    dimension: "creativity",
  }),
  createSkill({
    id: "skill-4",
    name: "System Boundary Mapping",
    status: "locked",
    dimension: "systemDecomposition",
    difficulty: 3,
    prerequisiteIds: ["skill-1", "skill-2"],
  }),
  createSkill({
    id: "skill-2",
    name: "Intent-to-Prompt Translation",
    status: "completed",
    dimension: "promptPrecision",
    difficulty: 1,
  }),
];

async function renderDashboardPage(options: {
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
    { default: DashboardPage },
    { SessionProvider, createStoredSession, sessionStore },
    { MemoryRouter, Route, Routes },
  ] = await Promise.all([
    import("./Dashboard"),
    import("../lib/session"),
    import("react-router-dom"),
  ]);

  sessionStore.clearSession();

  if (options.withStoredSession ?? true) {
    sessionStore.setSession(createStoredSession(authResponse));
  }

  render(
    <SessionProvider>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<div>Diagnosis Page</div>} path="/diagnosis" />
          <Route element={<div>Auth Page</div>} path="/auth" />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

function getSkillItem(name: string): HTMLElement {
  const roadmap = screen.getByRole("list", { name: "Skill roadmap" });
  const skillItems = within(roadmap).getAllByRole("listitem");
  const matchingItem = skillItems.find((skillItem) =>
    within(skillItem).queryByRole("heading", { level: 3, name }) !== null
  );

  if (matchingItem === undefined) {
    throw new Error(`Expected skill item ${name} to exist.`);
  }

  return matchingItem;
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals?.();
  });

  it("redirects diagnosis-incomplete users back to /diagnosis", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(false)))
      .mockResolvedValueOnce(
        createSuccessResponse<GetSkillsResponse>({ skills: authoredSkills }),
      );

    await renderDashboardPage({ fetchMock });

    expect(await screen.findByText("Diagnosis Page")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/profile");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/skills");
  });

  it("renders the saved radar data for completed users", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(true)))
      .mockResolvedValueOnce(
        createSuccessResponse<GetSkillsResponse>({ skills: authoredSkills }),
      );

    await renderDashboardPage({ fetchMock });

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Your latest diagnosis signal",
      }),
    ).toBeInTheDocument();

    const radarScores = screen.getByRole("list", { name: "Radar dimension scores" });
    expect(within(radarScores).getByText("Creativity")).toBeInTheDocument();
    expect(within(radarScores).getByText("82")).toBeInTheDocument();
    expect(within(radarScores).getByText("Prompt Precision")).toBeInTheDocument();
    expect(within(radarScores).getByText("91")).toBeInTheDocument();
  });

  it("preserves the authored API order when rendering skills", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(true)))
      .mockResolvedValueOnce(
        createSuccessResponse<GetSkillsResponse>({ skills: authoredSkills }),
      );

    await renderDashboardPage({ fetchMock });

    const roadmap = await screen.findByRole("list", { name: "Skill roadmap" });
    const skillNames = within(roadmap)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);

    expect(skillNames).toEqual([
      "Workflow Step Decomposition",
      "Prompt Remixing Foundations",
      "System Boundary Mapping",
      "Intent-to-Prompt Translation",
    ]);
  });

  it("renders locked, available, in-progress, and completed skill states with prerequisite names", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createSuccessResponse(createProfileResponse(true)))
      .mockResolvedValueOnce(
        createSuccessResponse<GetSkillsResponse>({ skills: authoredSkills }),
      );

    await renderDashboardPage({ fetchMock });
    await screen.findByRole("list", { name: "Skill roadmap" });

    const inProgressSkill = getSkillItem("Workflow Step Decomposition");
    expect(within(inProgressSkill).getByText("In Progress")).toBeInTheDocument();
    expect(
      within(inProgressSkill).getByText("Currently active in your skill path."),
    ).toBeInTheDocument();

    const availableSkill = getSkillItem("Prompt Remixing Foundations");
    expect(within(availableSkill).getByText("Available")).toBeInTheDocument();
    expect(
      within(availableSkill).getByText(
        "Ready to start based on your current profile and prerequisites.",
      ),
    ).toBeInTheDocument();

    const lockedSkill = getSkillItem("System Boundary Mapping");
    expect(within(lockedSkill).getByText("Locked")).toBeInTheDocument();
    expect(
      within(lockedSkill).getByText(
        "Requires Prompt Remixing Foundations, Intent-to-Prompt Translation.",
      ),
    ).toBeInTheDocument();

    const completedSkill = getSkillItem("Intent-to-Prompt Translation");
    expect(within(completedSkill).getByText("Completed")).toBeInTheDocument();
    expect(
      within(completedSkill).getByText(
        "Completed and ready to support downstream skills.",
      ),
    ).toBeInTheDocument();
  });
});
