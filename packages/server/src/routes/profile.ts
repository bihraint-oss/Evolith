import type {
  AnswerDiagnosisRequest,
  AnswerDiagnosisResponse,
  CognitiveProfile,
  DiagnosisAnswer,
  DiagnosisQuestionSnapshot,
  DiagnosisResult,
  DiagnosisSessionView,
  GetDiagnosisSessionResponse,
  GetProfileResponse,
  StartDiagnosisResponse,
} from "@evolith/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { z } from "zod";

import type { AppDatabase } from "../db/client";
import {
  type CognitiveProfileRow,
  type DiagnosisSessionRow,
  cognitiveProfiles,
  diagnosisSessions,
} from "../db/schema";
import {
  type AuthContextBindings,
  createAuthMiddleware,
  getAuthenticatedUser,
} from "../middleware/auth";
import {
  buildDiagnosisRadarData,
  calculateDiagnosisScores,
  createDiagnosisAnswer,
  createDiagnosisQuestionSnapshots,
  getCurrentDiagnosisQuestion,
  getDiagnosisProgress,
} from "../services/diagnosis";
import type { TokenService } from "../lib/auth/tokens";
import { errorResponse, successResponse } from "../lib/http";

export interface ProfileRouteDependencies {
  db: AppDatabase;
  tokenService: Pick<TokenService, "verifyAccessToken">;
}

const answerDiagnosisRequestSchema = z.object({
  choiceId: z.string().trim().min(1),
}) satisfies z.ZodType<Pick<AnswerDiagnosisRequest, "choiceId">>;

type ParsedBodyResult<TData> =
  | { success: true; data: TData }
  | { success: false; response: Response };

type ProfileContext = Context<AuthContextBindings>;

function toValidationMessage(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "body";
      return `${field}: ${issue.message}`;
    })
    .join("; ");
}

function isMalformedJsonError(error: unknown): boolean {
  return error instanceof SyntaxError;
}

async function parseJsonBody<TData>(
  context: Context,
  schema: z.ZodType<TData>,
): Promise<ParsedBodyResult<TData>> {
  let payload: unknown;

  try {
    payload = await context.req.json();
  } catch (error) {
    if (!isMalformedJsonError(error)) {
      throw error;
    }

    return {
      success: false,
      response: errorResponse(
        context,
        "Malformed JSON request body",
        400,
        "invalid_json",
      ),
    };
  }

  const parsedPayload = schema.safeParse(payload);

  if (!parsedPayload.success) {
    return {
      success: false,
      response: errorResponse(
        context,
        `Invalid request body: ${toValidationMessage(parsedPayload.error)}`,
        400,
        "invalid_request_body",
      ),
    };
  }

  return {
    success: true,
    data: parsedPayload.data,
  };
}

function toCognitiveProfile(profile: CognitiveProfileRow): CognitiveProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    creativity: profile.creativity,
    imagination: profile.imagination,
    promptPrecision: profile.promptPrecision,
    systemDecomposition: profile.systemDecomposition,
    aiOrchestration: profile.aiOrchestration,
    lastDiagnosedAt: profile.lastDiagnosedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function findProfileByUserId(
  db: AppDatabase,
  userId: string,
): CognitiveProfileRow | undefined {
  return db
    .select()
    .from(cognitiveProfiles)
    .where(eq(cognitiveProfiles.userId, userId))
    .get();
}

function findDiagnosisSessionById(
  db: AppDatabase,
  sessionId: string,
  userId: string,
): DiagnosisSessionRow | undefined {
  return db
    .select()
    .from(diagnosisSessions)
    .where(
      and(
        eq(diagnosisSessions.id, sessionId),
        eq(diagnosisSessions.userId, userId),
      ),
    )
    .get();
}

function findInProgressDiagnosisSessionsByUserId(
  db: AppDatabase,
  userId: string,
): DiagnosisSessionRow[] {
  return db
    .select()
    .from(diagnosisSessions)
    .where(
      and(
        eq(diagnosisSessions.userId, userId),
        eq(diagnosisSessions.state, "inProgress"),
      ),
    )
    .orderBy(desc(diagnosisSessions.updatedAt))
    .limit(2)
    .all();
}

function isDuplicateInProgressDiagnosisSessionError(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    !("message" in error)
  ) {
    return false;
  }

  return (
    error.code === "SQLITE_CONSTRAINT_UNIQUE" &&
    typeof error.message === "string" &&
    error.message.includes("diagnosis_sessions.user_id")
  );
}

function hasSequentialAnswers(
  questions: readonly DiagnosisQuestionSnapshot[],
  answers: readonly DiagnosisAnswer[],
): boolean {
  if (answers.length > questions.length) {
    return false;
  }

  return answers.every((answer, index) => {
    const question = questions[index];

    if (question === undefined || answer.questionId !== question.id) {
      return false;
    }

    return question.choices.some((choice) => choice.id === answer.choiceId);
  });
}

function buildCompletedDiagnosisResult(
  session: DiagnosisSessionRow,
): DiagnosisResult {
  const scores =
    session.profileSnapshot ??
    calculateDiagnosisScores(session.questions, session.answers);

  return {
    scores,
    radar: buildDiagnosisRadarData(scores),
  };
}

function getInvalidInProgressSessionResponse(
  context: ProfileContext,
  session: DiagnosisSessionRow,
): Response | null {
  if (
    session.state === "inProgress" &&
    !hasSequentialAnswers(session.questions, session.answers)
  ) {
    return errorResponse(
      context,
      "Diagnosis session answers are out of order",
      409,
      "answer_sequence_invalid",
    );
  }

  return null;
}

function getDuplicateInProgressSessionResponse(
  context: ProfileContext,
): Response {
  return errorResponse(
    context,
    "Multiple in-progress diagnosis sessions exist for this user",
    409,
    "diagnosis_session_conflict",
  );
}

function toDiagnosisSessionView(
  session: DiagnosisSessionRow,
): DiagnosisSessionView {
  const progress = getDiagnosisProgress(session.questions, session.answers);

  if (session.state === "completed") {
    return {
      id: session.id,
      state: "completed",
      progress,
      currentQuestion: null,
      result: buildCompletedDiagnosisResult(session),
      completedAt: session.completedAt ?? session.updatedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  const currentQuestion = getCurrentDiagnosisQuestion(
    session.questions,
    session.answers,
  );

  if (currentQuestion === null) {
    throw new Error(
      `Diagnosis session ${session.id} is in progress but has no remaining question`,
    );
  }

  return {
    id: session.id,
    state: "inProgress",
    progress,
    currentQuestion,
    result: null,
    completedAt: null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function toInProgressDiagnosisSessionView(
  session: DiagnosisSessionRow,
): StartDiagnosisResponse["session"] {
  const view = toDiagnosisSessionView(session);

  if (view.state !== "inProgress") {
    throw new Error(
      `Expected diagnosis session ${session.id} to be in progress, received ${view.state}`,
    );
  }

  return view;
}

function requireProfile(
  context: ProfileContext,
  db: AppDatabase,
  userId: string,
): CognitiveProfileRow | Response {
  const profile = findProfileByUserId(db, userId);

  if (profile === undefined) {
    return errorResponse(context, "Profile not found", 404, "profile_not_found");
  }

  return profile;
}

function requireDiagnosisSession(
  context: ProfileContext,
  db: AppDatabase,
  sessionId: string,
  userId: string,
): DiagnosisSessionRow | Response {
  const session = findDiagnosisSessionById(db, sessionId, userId);

  if (session === undefined) {
    return errorResponse(
      context,
      "Diagnosis session not found",
      404,
      "diagnosis_session_not_found",
    );
  }

  return session;
}

export function createProfileRouter(
  dependencies: ProfileRouteDependencies,
): Hono<AuthContextBindings> {
  const router = new Hono<AuthContextBindings>();
  const authMiddleware = createAuthMiddleware({
    tokenService: dependencies.tokenService,
  });

  router.use("/profile", authMiddleware);
  router.use("/profile/*", authMiddleware);

  router.get("/profile", (context) => {
    const auth = getAuthenticatedUser(context);
    const profile = requireProfile(context, dependencies.db, auth.userId);

    if (profile instanceof Response) {
      return profile;
    }

    const response: GetProfileResponse = {
      profile: toCognitiveProfile(profile),
      hasCompletedDiagnosis: profile.lastDiagnosedAt !== null,
      lastDiagnosedAt: profile.lastDiagnosedAt,
      radar:
        profile.lastDiagnosedAt === null
          ? null
          : buildDiagnosisRadarData({
              creativity: profile.creativity,
              imagination: profile.imagination,
              promptPrecision: profile.promptPrecision,
              systemDecomposition: profile.systemDecomposition,
              aiOrchestration: profile.aiOrchestration,
            }),
    };

    return successResponse(context, response);
  });

  router.post("/profile/diagnosis/start", (context) => {
    const auth = getAuthenticatedUser(context);
    const profile = requireProfile(context, dependencies.db, auth.userId);

    if (profile instanceof Response) {
      return profile;
    }

    const existingSessions = findInProgressDiagnosisSessionsByUserId(
      dependencies.db,
      auth.userId,
    );

    if (existingSessions.length > 1) {
      return getDuplicateInProgressSessionResponse(context);
    }

    const existingSession = existingSessions[0];

    if (existingSession !== undefined) {
      const invalidSessionResponse = getInvalidInProgressSessionResponse(
        context,
        existingSession,
      );

      if (invalidSessionResponse !== null) {
        return invalidSessionResponse;
      }

      const response: StartDiagnosisResponse = {
        session: toInProgressDiagnosisSessionView(existingSession),
      };

      return successResponse(context, response);
    }

    const sessionId = crypto.randomUUID();

    try {
      dependencies.db
        .insert(diagnosisSessions)
        .values({
          id: sessionId,
          userId: auth.userId,
          state: "inProgress",
          questions: createDiagnosisQuestionSnapshots(),
          answers: [],
          profileSnapshot: null,
          completedAt: null,
        })
        .run();
    } catch (error) {
      if (isDuplicateInProgressDiagnosisSessionError(error)) {
        const conflictedSessions = findInProgressDiagnosisSessionsByUserId(
          dependencies.db,
          auth.userId,
        );

        if (conflictedSessions.length > 1) {
          return getDuplicateInProgressSessionResponse(context);
        }

        const conflictedSession = conflictedSessions[0];

        if (conflictedSession !== undefined) {
          const invalidSessionResponse = getInvalidInProgressSessionResponse(
            context,
            conflictedSession,
          );

          if (invalidSessionResponse !== null) {
            return invalidSessionResponse;
          }

          const response: StartDiagnosisResponse = {
            session: toInProgressDiagnosisSessionView(conflictedSession),
          };

          return successResponse(context, response);
        }
      }

      throw error;
    }

    const createdSession = findDiagnosisSessionById(
      dependencies.db,
      sessionId,
      auth.userId,
    );

    if (createdSession === undefined) {
      throw new Error(`Failed to load created diagnosis session ${sessionId}`);
    }

    const response: StartDiagnosisResponse = {
      session: toInProgressDiagnosisSessionView(createdSession),
    };

    return successResponse(context, response, 201);
  });

  router.get("/profile/diagnosis/:id", (context) => {
    const auth = getAuthenticatedUser(context);
    const session = requireDiagnosisSession(
      context,
      dependencies.db,
      context.req.param("id"),
      auth.userId,
    );

    if (session instanceof Response) {
      return session;
    }

    const invalidSessionResponse = getInvalidInProgressSessionResponse(
      context,
      session,
    );

    if (invalidSessionResponse !== null) {
      return invalidSessionResponse;
    }

    const response: GetDiagnosisSessionResponse = {
      session: toDiagnosisSessionView(session),
    };

    return successResponse(context, response);
  });

  router.post("/profile/diagnosis/:id/answer", async (context) => {
    const parsedBody = await parseJsonBody(
      context,
      answerDiagnosisRequestSchema,
    );

    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const auth = getAuthenticatedUser(context);
    const session = requireDiagnosisSession(
      context,
      dependencies.db,
      context.req.param("id"),
      auth.userId,
    );

    if (session instanceof Response) {
      return session;
    }

    if (session.state === "completed") {
      return errorResponse(
        context,
        "Diagnosis session is already completed",
        409,
        "diagnosis_session_completed",
      );
    }

    if (!hasSequentialAnswers(session.questions, session.answers)) {
      return errorResponse(
        context,
        "Diagnosis session answers are out of order",
        409,
        "answer_sequence_invalid",
      );
    }

    const answerResult = createDiagnosisAnswer(
      session.questions,
      session.answers,
      parsedBody.data.choiceId,
      new Date().toISOString(),
    );

    if (!answerResult.success) {
      if (answerResult.code === "invalid_choice") {
        return errorResponse(
          context,
          "Invalid choiceId for the current diagnosis question",
          400,
          "invalid_choice",
        );
      }

      return errorResponse(
        context,
        "Diagnosis session has no remaining questions",
        409,
        "no_remaining_question",
      );
    }

    const nextAnswers = [...session.answers, answerResult.answer];
    const isCompleted = nextAnswers.length >= session.questions.length;

    const persistedSession = dependencies.db.transaction((tx) => {
      if (isCompleted) {
        const result = buildCompletedDiagnosisResult({
          ...session,
          answers: nextAnswers,
          profileSnapshot: null,
        });

        tx.update(diagnosisSessions)
          .set({
            answers: nextAnswers,
            state: "completed",
            profileSnapshot: result.scores,
            completedAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(
            and(
              eq(diagnosisSessions.id, session.id),
              eq(diagnosisSessions.userId, auth.userId),
            ),
          )
          .run();

        tx.update(cognitiveProfiles)
          .set({
            creativity: result.scores.creativity,
            imagination: result.scores.imagination,
            promptPrecision: result.scores.promptPrecision,
            systemDecomposition: result.scores.systemDecomposition,
            aiOrchestration: result.scores.aiOrchestration,
            lastDiagnosedAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(cognitiveProfiles.userId, auth.userId))
          .run();

        const updatedProfile = tx
          .select({ id: cognitiveProfiles.id })
          .from(cognitiveProfiles)
          .where(eq(cognitiveProfiles.userId, auth.userId))
          .get();

        if (updatedProfile === undefined) {
          throw new Error(
            `Failed to update cognitive profile for user ${auth.userId}`,
          );
        }
      } else {
        tx.update(diagnosisSessions)
          .set({
            answers: nextAnswers,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(
            and(
              eq(diagnosisSessions.id, session.id),
              eq(diagnosisSessions.userId, auth.userId),
            ),
          )
          .run();
      }

      return tx
        .select()
        .from(diagnosisSessions)
        .where(
          and(
            eq(diagnosisSessions.id, session.id),
            eq(diagnosisSessions.userId, auth.userId),
          ),
        )
        .get();
    });

    if (persistedSession === undefined) {
      throw new Error(`Failed to load diagnosis session ${session.id}`);
    }

    const response: AnswerDiagnosisResponse = {
      session: toDiagnosisSessionView(persistedSession),
    };

    return successResponse(context, response);
  });

  return router;
}
