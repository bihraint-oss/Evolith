import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type {
  AnswerDiagnosisResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthResponse,
  CompletedDiagnosisSessionView,
  DiagnosisSessionView,
  GetDiagnosisSessionResponse,
  GetProfileResponse,
  InProgressDiagnosisSessionView,
  StartDiagnosisResponse,
} from "@evolith/shared";
import { describe, expect, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import pino from "pino";

import { createApp } from "../app";
import {
  type DatabaseClient,
  createDatabaseClient,
} from "../db/client";
import { runMigrations } from "../db/migrate";
import {
  cognitiveProfiles,
  diagnosisSessions,
} from "../db/schema";
import { createTokenService } from "../lib/auth/tokens";

interface TestAppContext {
  app: ReturnType<typeof createApp>;
  dbClient: DatabaseClient;
  cleanup: () => void;
}

interface RegisteredUser {
  userId: string;
  accessToken: string;
}

const strongChoiceIdsByQuestionId: Record<string, string> = {
  "diagnosis-q1": "sequenced",
  "diagnosis-q2": "contrast-explore",
  "diagnosis-q3": "staged-flow",
  "diagnosis-q4": "tighten-and-debug",
  "diagnosis-q5": "concept-then-milestones",
  "diagnosis-q6": "standardized-flow",
};

const lowChoiceIdsByQuestionId: Record<string, string> = {
  "diagnosis-q1": "one-shot",
  "diagnosis-q2": "safe-repeat",
  "diagnosis-q3": "single-call",
  "diagnosis-q4": "rerun",
  "diagnosis-q5": "build-now",
  "diagnosis-q6": "ad-hoc-sharing",
};

const strongScores = {
  creativity: 80,
  imagination: 83,
  promptPrecision: 90,
  systemDecomposition: 85,
  aiOrchestration: 78,
};

const lowScores = {
  creativity: 23,
  imagination: 20,
  promptPrecision: 15,
  systemDecomposition: 12,
  aiOrchestration: 17,
};

function createTestAppContext(): TestAppContext {
  const directory = mkdtempSync(join(tmpdir(), "evolith-profile-test-"));
  const databaseFile = join(directory, "test.db");

  runMigrations({ databaseFile });

  const dbClient = createDatabaseClient({ databaseFile });
  const tokenService = createTokenService({
    accessSecret: "test-access-secret-1234567890",
    refreshSecret: "test-refresh-secret-1234567890",
    accessTtl: "15m",
    refreshTtl: "7d",
  });
  const app = createApp({
    db: dbClient.db,
    logger: pino({ enabled: false }),
    tokenService,
  });

  return {
    app,
    dbClient,
    cleanup: () => {
      dbClient.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

function createHeaders(
  accessToken?: string,
  contentType?: string,
): Headers {
  const headers = new Headers();

  if (contentType !== undefined) {
    headers.set("content-type", contentType);
  }

  if (accessToken !== undefined) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

async function getRequest(
  app: TestAppContext["app"],
  path: string,
  accessToken?: string,
): Promise<Response> {
  return app.request(path, {
    method: "GET",
    headers: createHeaders(accessToken),
  });
}

async function postJson(
  app: TestAppContext["app"],
  path: string,
  payload: unknown,
  accessToken?: string,
): Promise<Response> {
  return app.request(path, {
    method: "POST",
    headers: createHeaders(accessToken, "application/json"),
    body: JSON.stringify(payload),
  });
}

async function parseJson<TResponse>(response: Response): Promise<TResponse> {
  return (await response.json()) as TResponse;
}

async function registerUser(
  app: TestAppContext["app"],
  email = `user-${crypto.randomUUID()}@example.com`,
): Promise<RegisteredUser> {
  const response = await postJson(app, "/api/auth/register", {
    email,
    password: "password123",
    displayName: "Test User",
  });

  expect(response.status).toBe(201);

  const body = await parseJson<ApiSuccessResponse<AuthResponse>>(response);

  return {
    userId: body.data.user.id,
    accessToken: body.data.tokens.accessToken,
  };
}

function expectInProgressSession(
  session: DiagnosisSessionView,
): InProgressDiagnosisSessionView {
  expect(session.state).toBe("inProgress");

  if (session.state !== "inProgress") {
    throw new Error(`Expected in-progress session, received ${session.state}`);
  }

  return session;
}

function expectCompletedSession(
  session: DiagnosisSessionView,
): CompletedDiagnosisSessionView {
  expect(session.state).toBe("completed");

  if (session.state !== "completed") {
    throw new Error(`Expected completed session, received ${session.state}`);
  }

  return session;
}

async function startDiagnosis(
  app: TestAppContext["app"],
  accessToken: string,
): Promise<{
  response: Response;
  body: ApiSuccessResponse<StartDiagnosisResponse>;
}> {
  const response = await postJson(app, "/api/profile/diagnosis/start", {}, accessToken);
  const body = await parseJson<ApiSuccessResponse<StartDiagnosisResponse>>(response);

  return { response, body };
}

async function getProfile(
  app: TestAppContext["app"],
  accessToken: string,
): Promise<{
  response: Response;
  body: ApiSuccessResponse<GetProfileResponse>;
}> {
  const response = await getRequest(app, "/api/profile", accessToken);
  const body = await parseJson<ApiSuccessResponse<GetProfileResponse>>(response);

  return { response, body };
}

async function getDiagnosisSession(
  app: TestAppContext["app"],
  sessionId: string,
  accessToken: string,
): Promise<{
  response: Response;
  body: ApiSuccessResponse<GetDiagnosisSessionResponse>;
}> {
  const response = await getRequest(
    app,
    `/api/profile/diagnosis/${sessionId}`,
    accessToken,
  );
  const body = await parseJson<ApiSuccessResponse<GetDiagnosisSessionResponse>>(response);

  return { response, body };
}

async function answerDiagnosis(
  app: TestAppContext["app"],
  sessionId: string,
  choiceId: string,
  accessToken: string,
): Promise<{
  response: Response;
  body: ApiSuccessResponse<AnswerDiagnosisResponse>;
}> {
  const response = await postJson(
    app,
    `/api/profile/diagnosis/${sessionId}/answer`,
    { choiceId },
    accessToken,
  );
  const body = await parseJson<ApiSuccessResponse<AnswerDiagnosisResponse>>(response);

  return { response, body };
}

async function completeDiagnosisSession(
  app: TestAppContext["app"],
  session: InProgressDiagnosisSessionView,
  accessToken: string,
  choiceIdsByQuestionId: Record<string, string>,
): Promise<CompletedDiagnosisSessionView> {
  let currentSession: DiagnosisSessionView = session;

  while (currentSession.state === "inProgress") {
    const choiceId = choiceIdsByQuestionId[currentSession.currentQuestion.id];

    expect(choiceId).toBeDefined();

    if (choiceId === undefined) {
      throw new Error(
        `No choice configured for question ${currentSession.currentQuestion.id}`,
      );
    }

    const answerResult = await answerDiagnosis(
      app,
      currentSession.id,
      choiceId,
      accessToken,
    );

    expect(answerResult.response.status).toBe(200);

    currentSession = answerResult.body.data.session;
  }

  return expectCompletedSession(currentSession);
}

describe("profile diagnosis routes", () => {
  test("rejects unauthenticated profile access", async () => {
    const context = createTestAppContext();

    try {
      const response = await context.app.request("/api/profile");
      const body = await parseJson<ApiErrorResponse>(response);

      expect(response.status).toBe(401);
      expect(body.error.code).toBe("auth_required");
    } finally {
      context.cleanup();
    }
  });

  test("returns profile state before diagnosis completion", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "profile-before@example.com");
      const profileResult = await getProfile(context.app, user.accessToken);

      expect(profileResult.response.status).toBe(200);
      expect(profileResult.body.data.hasCompletedDiagnosis).toBe(false);
      expect(profileResult.body.data.lastDiagnosedAt).toBeNull();
      expect(profileResult.body.data.radar).toBeNull();
      expect(profileResult.body.data.profile.userId).toBe(user.userId);
      expect(profileResult.body.data.profile.creativity).toBe(0);
      expect(profileResult.body.data.profile.imagination).toBe(0);
      expect(profileResult.body.data.profile.promptPrecision).toBe(0);
      expect(profileResult.body.data.profile.systemDecomposition).toBe(0);
      expect(profileResult.body.data.profile.aiOrchestration).toBe(0);
    } finally {
      context.cleanup();
    }
  });

  test("starts a diagnosis once and resumes the existing in-progress session", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "resume-session@example.com");
      const firstStart = await startDiagnosis(context.app, user.accessToken);
      const secondStart = await startDiagnosis(context.app, user.accessToken);
      const firstSession = expectInProgressSession(firstStart.body.data.session);
      const secondSession = expectInProgressSession(secondStart.body.data.session);
      const storedSessions = context.dbClient.db
        .select()
        .from(diagnosisSessions)
        .where(
          and(
            eq(diagnosisSessions.userId, user.userId),
            eq(diagnosisSessions.state, "inProgress"),
          ),
        )
        .all();

      expect(firstStart.response.status).toBe(201);
      expect(secondStart.response.status).toBe(200);
      expect(firstSession.id).toBe(secondSession.id);
      expect(firstSession.progress).toEqual({
        totalQuestions: 6,
        answeredQuestions: 0,
        remainingQuestions: 6,
        completionPercentage: 0,
      });
      expect(firstSession.currentQuestion.id).toBe("diagnosis-q1");
      expect(storedSessions).toHaveLength(1);
    } finally {
      context.cleanup();
    }
  });

  test("rejects invalid choices and detects persisted out-of-order answers", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "invalid-answer@example.com");
      const started = await startDiagnosis(context.app, user.accessToken);
      const session = expectInProgressSession(started.body.data.session);

      const invalidChoiceResponse = await postJson(
        context.app,
        `/api/profile/diagnosis/${session.id}/answer`,
        { choiceId: "not-a-real-choice" },
        user.accessToken,
      );
      const invalidChoiceBody =
        await parseJson<ApiErrorResponse>(invalidChoiceResponse);

      expect(invalidChoiceResponse.status).toBe(400);
      expect(invalidChoiceBody.error.code).toBe("invalid_choice");

      context.dbClient.db
        .update(diagnosisSessions)
        .set({
          answers: [
            {
              questionId: "diagnosis-q2",
              choiceId: "contrast-explore",
              answeredAt: "2026-04-19T00:00:00.000Z",
            },
          ],
        })
        .where(eq(diagnosisSessions.id, session.id))
        .run();

      const outOfOrderResponse = await postJson(
        context.app,
        `/api/profile/diagnosis/${session.id}/answer`,
        { choiceId: "staged-flow" },
        user.accessToken,
      );
      const outOfOrderBody =
        await parseJson<ApiErrorResponse>(outOfOrderResponse);

      expect(outOfOrderResponse.status).toBe(409);
      expect(outOfOrderBody.error.code).toBe("answer_sequence_invalid");
    } finally {
      context.cleanup();
    }
  });

  test("completes a diagnosis, persists scores, and exposes completed views", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "complete-diagnosis@example.com");
      const started = await startDiagnosis(context.app, user.accessToken);
      const session = expectInProgressSession(started.body.data.session);
      let currentSession: DiagnosisSessionView = session;

      while (currentSession.state === "inProgress") {
        const isLastQuestion =
          currentSession.progress.answeredQuestions + 1 ===
          currentSession.progress.totalQuestions;
        const choiceId = strongChoiceIdsByQuestionId[currentSession.currentQuestion.id];

        expect(choiceId).toBeDefined();

        if (choiceId === undefined) {
          throw new Error(
            `No strong answer configured for ${currentSession.currentQuestion.id}`,
          );
        }

        if (isLastQuestion) {
          context.dbClient.db
            .update(diagnosisSessions)
            .set({
              updatedAt: "2000-01-01 00:00:00",
            })
            .where(eq(diagnosisSessions.id, currentSession.id))
            .run();

          context.dbClient.db
            .update(cognitiveProfiles)
            .set({
              updatedAt: "2000-01-01 00:00:00",
            })
            .where(eq(cognitiveProfiles.userId, user.userId))
            .run();
        }

        const answerResult = await answerDiagnosis(
          context.app,
          currentSession.id,
          choiceId,
          user.accessToken,
        );

        expect(answerResult.response.status).toBe(200);

        currentSession = answerResult.body.data.session;
      }

      const completedSession = expectCompletedSession(currentSession);
      const storedSession = context.dbClient.db
        .select()
        .from(diagnosisSessions)
        .where(eq(diagnosisSessions.id, completedSession.id))
        .get();
      const storedProfile = context.dbClient.db
        .select()
        .from(cognitiveProfiles)
        .where(eq(cognitiveProfiles.userId, user.userId))
        .get();
      const profileResult = await getProfile(context.app, user.accessToken);
      const fetchedSession = await getDiagnosisSession(
        context.app,
        completedSession.id,
        user.accessToken,
      );
      const repeatAnswerResponse = await postJson(
        context.app,
        `/api/profile/diagnosis/${completedSession.id}/answer`,
        { choiceId: "standardized-flow" },
        user.accessToken,
      );
      const repeatAnswerBody =
        await parseJson<ApiErrorResponse>(repeatAnswerResponse);

      expect(completedSession.progress).toEqual({
        totalQuestions: 6,
        answeredQuestions: 6,
        remainingQuestions: 0,
        completionPercentage: 100,
      });
      expect(completedSession.currentQuestion).toBeNull();
      expect(completedSession.completedAt).not.toBeNull();
      expect(completedSession.result).toEqual({
        scores: strongScores,
        radar: [
          { dimension: "creativity", value: 80 },
          { dimension: "imagination", value: 83 },
          { dimension: "promptPrecision", value: 90 },
          { dimension: "systemDecomposition", value: 85 },
          { dimension: "aiOrchestration", value: 78 },
        ],
      });

      expect(storedSession).toBeDefined();
      expect(storedSession?.state).toBe("completed");
      expect(storedSession?.profileSnapshot).toEqual(strongScores);
      expect(storedSession?.completedAt).not.toBeNull();
      expect(storedSession?.updatedAt).not.toBe("2000-01-01 00:00:00");

      expect(storedProfile).toBeDefined();
      expect(storedProfile?.creativity).toBe(80);
      expect(storedProfile?.imagination).toBe(83);
      expect(storedProfile?.promptPrecision).toBe(90);
      expect(storedProfile?.systemDecomposition).toBe(85);
      expect(storedProfile?.aiOrchestration).toBe(78);
      expect(storedProfile?.lastDiagnosedAt).not.toBeNull();
      expect(storedProfile?.updatedAt).not.toBe("2000-01-01 00:00:00");

      expect(profileResult.response.status).toBe(200);
      expect(profileResult.body.data.hasCompletedDiagnosis).toBe(true);
      if (storedProfile === undefined) {
        throw new Error("Expected stored profile to exist after diagnosis.");
      }

      expect(profileResult.body.data.lastDiagnosedAt).toBe(storedProfile.lastDiagnosedAt);
      expect(profileResult.body.data.profile.creativity).toBe(80);
      expect(profileResult.body.data.radar).toEqual([
        { dimension: "creativity", value: 80 },
        { dimension: "imagination", value: 83 },
        { dimension: "promptPrecision", value: 90 },
        { dimension: "systemDecomposition", value: 85 },
        { dimension: "aiOrchestration", value: 78 },
      ]);

      expect(fetchedSession.response.status).toBe(200);
      expect(fetchedSession.body.data.session).toEqual(completedSession);

      expect(repeatAnswerResponse.status).toBe(409);
      expect(repeatAnswerBody.error.code).toBe("diagnosis_session_completed");
    } finally {
      context.cleanup();
    }
  });

  test("overwrites the current profile on re-diagnosis and preserves completed session history", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "rediagnosis@example.com");
      const firstStart = await startDiagnosis(context.app, user.accessToken);
      const firstCompleted = await completeDiagnosisSession(
        context.app,
        expectInProgressSession(firstStart.body.data.session),
        user.accessToken,
        strongChoiceIdsByQuestionId,
      );
      const secondStart = await startDiagnosis(context.app, user.accessToken);
      const secondSession = expectInProgressSession(secondStart.body.data.session);
      const secondCompleted = await completeDiagnosisSession(
        context.app,
        secondSession,
        user.accessToken,
        lowChoiceIdsByQuestionId,
      );
      const completedSessions = context.dbClient.db
        .select()
        .from(diagnosisSessions)
        .where(
          and(
            eq(diagnosisSessions.userId, user.userId),
            eq(diagnosisSessions.state, "completed"),
          ),
        )
        .all();
      const storedFirstSession = context.dbClient.db
        .select()
        .from(diagnosisSessions)
        .where(eq(diagnosisSessions.id, firstCompleted.id))
        .get();
      const storedSecondSession = context.dbClient.db
        .select()
        .from(diagnosisSessions)
        .where(eq(diagnosisSessions.id, secondCompleted.id))
        .get();
      const storedProfile = context.dbClient.db
        .select()
        .from(cognitiveProfiles)
        .where(eq(cognitiveProfiles.userId, user.userId))
        .get();
      const profileResult = await getProfile(context.app, user.accessToken);

      expect(secondStart.response.status).toBe(201);
      expect(secondSession.id).not.toBe(firstCompleted.id);
      expect(completedSessions).toHaveLength(2);
      expect(storedFirstSession?.profileSnapshot).toEqual(strongScores);
      expect(storedSecondSession?.profileSnapshot).toEqual(lowScores);

      expect(storedProfile).toBeDefined();
      expect(storedProfile?.creativity).toBe(23);
      expect(storedProfile?.imagination).toBe(20);
      expect(storedProfile?.promptPrecision).toBe(15);
      expect(storedProfile?.systemDecomposition).toBe(12);
      expect(storedProfile?.aiOrchestration).toBe(17);
      expect(storedProfile?.lastDiagnosedAt).not.toBeNull();

      expect(profileResult.body.data.profile.creativity).toBe(23);
      expect(profileResult.body.data.profile.imagination).toBe(20);
      expect(profileResult.body.data.profile.promptPrecision).toBe(15);
      expect(profileResult.body.data.profile.systemDecomposition).toBe(12);
      expect(profileResult.body.data.profile.aiOrchestration).toBe(17);
      expect(profileResult.body.data.radar).toEqual([
        { dimension: "creativity", value: 23 },
        { dimension: "imagination", value: 20 },
        { dimension: "promptPrecision", value: 15 },
        { dimension: "systemDecomposition", value: 12 },
        { dimension: "aiOrchestration", value: 17 },
      ]);
    } finally {
      context.cleanup();
    }
  });

  test("hides diagnosis sessions from other authenticated users", async () => {
    const context = createTestAppContext();

    try {
      const owner = await registerUser(context.app, "owner@example.com");
      const otherUser = await registerUser(context.app, "other@example.com");
      const started = await startDiagnosis(context.app, owner.accessToken);
      const session = expectInProgressSession(started.body.data.session);
      const response = await getRequest(
        context.app,
        `/api/profile/diagnosis/${session.id}`,
        otherUser.accessToken,
      );
      const body = await parseJson<ApiErrorResponse>(response);

      expect(response.status).toBe(404);
      expect(body.error.code).toBe("diagnosis_session_not_found");
    } finally {
      context.cleanup();
    }
  });
});
