import type {
  GetSkillResponse,
  GetSkillsResponse,
  SkillNodeView,
  UserProgressStatus,
} from "@evolith/shared";
import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";

import type { AppDatabase } from "../db/client";
import {
  type SkillNodeRow,
  type UserProgressRow,
  cognitiveProfiles,
  skillNodes,
  userProgress,
} from "../db/schema";
import { errorResponse, successResponse } from "../lib/http";
import type { TokenService } from "../lib/auth/tokens";
import {
  type AuthContextBindings,
  createAuthMiddleware,
  getAuthenticatedUser,
} from "../middleware/auth";

export interface SkillsRouteDependencies {
  db: AppDatabase;
  tokenService: Pick<TokenService, "verifyAccessToken">;
}

function findAllSkillNodes(db: AppDatabase): SkillNodeRow[] {
  return db.select().from(skillNodes).orderBy(asc(skillNodes.id)).all();
}

function findUserProgressRows(
  db: AppDatabase,
  userId: string,
): UserProgressRow[] {
  return db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .all();
}

function createProgressIndex(
  progressRows: UserProgressRow[],
): Map<string, UserProgressRow> {
  return new Map(
    progressRows.map((progressRow) => [progressRow.skillNodeId, progressRow]),
  );
}

function createCompletedSkillIdSet(progressRows: UserProgressRow[]): Set<string> {
  return new Set(
    progressRows
      .filter(({ status }) => status === "completed")
      .map(({ skillNodeId }) => skillNodeId),
  );
}

/**
 * Derives the current skill status for a user.
 *
 * Stored progress overrides the computed state. Otherwise, skills remain
 * locked until diagnosis is complete, then unlock based on prerequisites.
 */
function deriveSkillStatus(
  skillNode: SkillNodeRow,
  progressRow: UserProgressRow | undefined,
  completedSkillIds: Set<string>,
  hasCompletedDiagnosis: boolean,
): UserProgressStatus {
  if (progressRow?.status === "completed") {
    return "completed";
  }

  if (progressRow?.status === "inProgress") {
    return "inProgress";
  }

  if (!hasCompletedDiagnosis) {
    return "locked";
  }

  const allPrerequisitesMet = skillNode.prerequisites.every((id) =>
    completedSkillIds.has(id),
  );

  return allPrerequisitesMet ? "available" : "locked";
}

/**
 * Maps the persisted skill node plus optional progress into the API view.
 */
function toSkillNodeView(
  skillNode: SkillNodeRow,
  progressRow: UserProgressRow | undefined,
  completedSkillIds: Set<string>,
  hasCompletedDiagnosis: boolean,
): SkillNodeView {
  return {
    id: skillNode.id,
    name: skillNode.name,
    description: skillNode.description,
    dimension: skillNode.dimension,
    difficulty: skillNode.difficulty,
    prerequisiteIds: [...skillNode.prerequisites],
    completionCriteria: skillNode.completionCriteria,
    createdAt: skillNode.createdAt,
    updatedAt: skillNode.updatedAt,
    status: deriveSkillStatus(
      skillNode,
      progressRow,
      completedSkillIds,
      hasCompletedDiagnosis,
    ),
  };
}

/**
 * Returns whether the user has completed diagnosis.
 */
function hasUserCompletedDiagnosis(
  db: AppDatabase,
  userId: string,
): boolean {
  const profile = db
    .select()
    .from(cognitiveProfiles)
    .where(eq(cognitiveProfiles.userId, userId))
    .get();
  // Profile exists but diagnosis is complete only when lastDiagnosedAt is set
  return profile !== undefined && profile.lastDiagnosedAt !== null;
}

/**
 * Loads the full skill graph and overlays user-specific progress state.
 */
function listSkillNodeViews(db: AppDatabase, userId: string): SkillNodeView[] {
  const allSkillNodes = findAllSkillNodes(db);
  const progressRows = findUserProgressRows(db, userId);
  const progressBySkillNodeId = createProgressIndex(progressRows);
  const completedSkillIds = createCompletedSkillIdSet(progressRows);
  const hasCompletedDiagnosis = hasUserCompletedDiagnosis(db, userId);

  return allSkillNodes.map((skillNode) =>
    toSkillNodeView(
      skillNode,
      progressBySkillNodeId.get(skillNode.id),
      completedSkillIds,
      hasCompletedDiagnosis,
    ),
  );
}

/**
 * Creates an authenticated skills router for the skill graph read API.
 *
 * All routes require a valid Bearer token. Locked skill details still return
 * the computed node view so clients can render future anchors.
 *
 * @param dependencies - Route dependencies for database access and token validation
 * @returns Hono router with authenticated `GET /skills` and `GET /skills/:id`
 */
export function createSkillsRouter(
  dependencies: SkillsRouteDependencies,
): Hono<AuthContextBindings> {
  const router = new Hono<AuthContextBindings>();
  const authMiddleware = createAuthMiddleware({
    tokenService: dependencies.tokenService,
  });

  router.use("/skills", authMiddleware);
  router.use("/skills/*", authMiddleware);

  router.get("/skills", (context) => {
    const auth = getAuthenticatedUser(context);
    const response: GetSkillsResponse = {
      skills: listSkillNodeViews(dependencies.db, auth.userId),
    };

    return successResponse(context, response);
  });

  router.get("/skills/:id", (context) => {
    const auth = getAuthenticatedUser(context);
    const skills = listSkillNodeViews(dependencies.db, auth.userId);
    const skill = skills.find(
      (candidateSkill) => candidateSkill.id === context.req.param("id"),
    );

    if (skill === undefined) {
      return errorResponse(context, "Skill not found", 404, "skill_not_found");
    }

    const response: GetSkillResponse = { skill };

    return successResponse(context, response);
  });

  return router;
}
