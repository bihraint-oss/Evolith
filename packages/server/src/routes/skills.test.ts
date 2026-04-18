import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthResponse,
  GetSkillResponse,
  GetSkillsResponse,
  SkillNodeView,
} from "@evolith/shared";
import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import pino from "pino";

import { createApp } from "../app";
import {
  type DatabaseClient,
  createDatabaseClient,
} from "../db/client";
import { runMigrations } from "../db/migrate";
import {
  AI_DEVELOPER_SKILL_TREE_NODE_COUNT,
  aiDeveloperSkillTree,
} from "../db/seed-data/skill-tree";
import { seedSkillTree } from "../db/seed";
import { cognitiveProfiles, userProgress } from "../db/schema";
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

const lockedSkillId = "00000000-0000-4000-8000-000000000006";
const prerequisiteSkillIdsForLockedSkill = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000003",
] as const;
const completedOverrideSkillId = "00000000-0000-4000-8000-000000000008";
const inProgressOverrideSkillId = lockedSkillId;
const dependentSkillId = "00000000-0000-4000-8000-000000000011";
const missingSkillId = "00000000-0000-4000-8000-999999999999";
const rootSkillIds = aiDeveloperSkillTree
  .filter((node) => node.prerequisiteIds.length === 0)
  .map((node) => node.id);
const expectedSkillIds = aiDeveloperSkillTree.map((node) => node.id);

function createTestAppContext(): TestAppContext {
  const directory = mkdtempSync(join(tmpdir(), "evolith-skills-test-"));
  const databaseFile = join(directory, "test.db");

  runMigrations({ databaseFile });

  const dbClient = createDatabaseClient({ databaseFile });
  const seededNodeCount = seedSkillTree(dbClient.db);

  expect(seededNodeCount).toBe(AI_DEVELOPER_SKILL_TREE_NODE_COUNT);

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

async function parseJson<TResponse>(response: Response): Promise<TResponse> {
  return (await response.json()) as TResponse;
}

async function registerUser(
  app: TestAppContext["app"],
  email = `user-${crypto.randomUUID()}@example.com`,
): Promise<RegisteredUser> {
  const response = await app.request("/api/auth/register", {
    method: "POST",
    headers: createHeaders(undefined, "application/json"),
    body: JSON.stringify({
      email,
      password: "password123",
      displayName: "Test User",
    }),
  });

  expect(response.status).toBe(201);

  const body = await parseJson<ApiSuccessResponse<AuthResponse>>(response);

  return {
    userId: body.data.user.id,
    accessToken: body.data.tokens.accessToken,
  };
}

async function getSkills(
  app: TestAppContext["app"],
  accessToken: string,
): Promise<{
  response: Response;
  body: ApiSuccessResponse<GetSkillsResponse>;
}> {
  const response = await getRequest(app, "/api/skills", accessToken);
  const body = await parseJson<ApiSuccessResponse<GetSkillsResponse>>(response);

  return { response, body };
}

async function getSkill(
  app: TestAppContext["app"],
  skillId: string,
  accessToken: string,
): Promise<{
  response: Response;
  body: ApiSuccessResponse<GetSkillResponse>;
}> {
  const response = await getRequest(app, `/api/skills/${skillId}`, accessToken);
  const body = await parseJson<ApiSuccessResponse<GetSkillResponse>>(response);

  return { response, body };
}

function findSkill(skills: SkillNodeView[], skillId: string): SkillNodeView {
  const skill = skills.find((candidateSkill) => candidateSkill.id === skillId);

  expect(skill).toBeDefined();

  if (skill === undefined) {
    throw new Error(`Expected skill ${skillId} to exist in response`);
  }

  return skill;
}

function completeDiagnosisForUser(
  context: TestAppContext,
  userId: string,
): void {
  context.dbClient.db
    .update(cognitiveProfiles)
    .set({ lastDiagnosedAt: "2026-04-19T10:00:00.000Z" })
    .where(eq(cognitiveProfiles.userId, userId))
    .run();
}

function insertCompletedPrerequisitesForLockedSkill(
  context: TestAppContext,
  userId: string,
  startedHourOffset = 1,
): void {
  context.dbClient.db.insert(userProgress).values(
    prerequisiteSkillIdsForLockedSkill.map((skillNodeId, index) => ({
      id: crypto.randomUUID(),
      userId,
      skillNodeId,
      status: "completed" as const,
      startedAt: `2026-04-19T0${startedHourOffset + index}:00:00.000Z`,
      completedAt: `2026-04-19T0${startedHourOffset + index + 1}:30:00.000Z`,
      score: 90 + index,
    })),
  ).run();
}

describe("skills routes", () => {
  test("rejects unauthenticated skills list access", async () => {
    const context = createTestAppContext();

    try {
      const response = await context.app.request("/api/skills");
      const body = await parseJson<ApiErrorResponse>(response);

      expect(response.status).toBe(401);
      expect(body.error.code).toBe("auth_required");
    } finally {
      context.cleanup();
    }
  });

  test("rejects unauthenticated skill detail access", async () => {
    const context = createTestAppContext();

    try {
      const response = await context.app.request(`/api/skills/${lockedSkillId}`);
      const body = await parseJson<ApiErrorResponse>(response);

      expect(response.status).toBe(401);
      expect(body.error.code).toBe("auth_required");
    } finally {
      context.cleanup();
    }
  });

  test("returns all seeded skills in authored order with every skill locked until diagnosis completion", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "skills-defaults@example.com");
      const result = await getSkills(context.app, user.accessToken);

      expect(result.response.status).toBe(200);
      expect(result.body.data.skills).toHaveLength(AI_DEVELOPER_SKILL_TREE_NODE_COUNT);
      expect(result.body.data.skills.map((skill) => skill.id)).toEqual(expectedSkillIds);

      rootSkillIds.forEach((skillId) => {
        expect(findSkill(result.body.data.skills, skillId).status).toBe("locked");
      });

      const lockedSkill = findSkill(result.body.data.skills, lockedSkillId);

      expect(lockedSkill.status).toBe("locked");
      expect(lockedSkill.startedAt).toBeNull();
      expect(lockedSkill.completedAt).toBeNull();
      expect(lockedSkill.score).toBeNull();
    } finally {
      context.cleanup();
    }
  });

  test("makes root skills available after diagnosis completion", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "skills-unlock@example.com");
      completeDiagnosisForUser(context, user.userId);

      const result = await getSkills(context.app, user.accessToken);
      const rootSkill = findSkill(result.body.data.skills, rootSkillIds[0]!);
      const lockedSkill = findSkill(result.body.data.skills, lockedSkillId);

      expect(result.response.status).toBe(200);
      expect(rootSkill.status).toBe("available");
      expect(lockedSkill.status).toBe("locked");
    } finally {
      context.cleanup();
    }
  });

  test("keeps skills locked after completing prerequisites when diagnosis is incomplete", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "skills-derived@example.com");
      insertCompletedPrerequisitesForLockedSkill(context, user.userId);

      const result = await getSkills(context.app, user.accessToken);
      const unlockedSkill = findSkill(result.body.data.skills, lockedSkillId);

      expect(result.response.status).toBe(200);
      expect(unlockedSkill.status).toBe("locked");
      expect(unlockedSkill.startedAt).toBeNull();
      expect(unlockedSkill.completedAt).toBeNull();
      expect(unlockedSkill.score).toBeNull();
    } finally {
      context.cleanup();
    }
  });

  test("makes prerequisite-gated skills available after diagnosis completion", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "skills-derived-available@example.com");
      completeDiagnosisForUser(context, user.userId);
      insertCompletedPrerequisitesForLockedSkill(context, user.userId);

      const result = await getSkills(context.app, user.accessToken);
      const availableSkill = findSkill(result.body.data.skills, lockedSkillId);

      expect(result.response.status).toBe(200);
      expect(availableSkill.status).toBe("available");
      expect(availableSkill.startedAt).toBeNull();
      expect(availableSkill.completedAt).toBeNull();
      expect(availableSkill.score).toBeNull();
    } finally {
      context.cleanup();
    }
  });

  test("preserves in-progress and completed overrides while dependents stay locked until prerequisites are completed", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "skills-overrides@example.com");

      context.dbClient.db.insert(userProgress).values([
        {
          id: crypto.randomUUID(),
          userId: user.userId,
          skillNodeId: inProgressOverrideSkillId,
          status: "inProgress",
          startedAt: "2026-04-19T01:00:00.000Z",
          completedAt: null,
          score: 48,
        },
        {
          id: crypto.randomUUID(),
          userId: user.userId,
          skillNodeId: completedOverrideSkillId,
          status: "completed",
          startedAt: "2026-04-19T02:00:00.000Z",
          completedAt: "2026-04-19T03:00:00.000Z",
          score: 95,
        },
      ]).run();

      const result = await getSkills(context.app, user.accessToken);
      const inProgressSkill = findSkill(result.body.data.skills, inProgressOverrideSkillId);
      const completedSkill = findSkill(result.body.data.skills, completedOverrideSkillId);
      const dependentSkill = findSkill(result.body.data.skills, dependentSkillId);

      expect(result.response.status).toBe(200);
      expect(inProgressSkill.status).toBe("inProgress");
      expect(inProgressSkill.startedAt).toBe("2026-04-19T01:00:00.000Z");
      expect(inProgressSkill.completedAt).toBeNull();
      expect(inProgressSkill.score).toBe(48);
      expect(completedSkill.status).toBe("completed");
      expect(completedSkill.completedAt).toBe("2026-04-19T03:00:00.000Z");
      expect(completedSkill.score).toBe(95);
      expect(dependentSkill.status).toBe("locked");
    } finally {
      context.cleanup();
    }
  });

  test("returns locked skill details with 200 and locked status", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "skills-detail@example.com");
      const result = await getSkill(context.app, lockedSkillId, user.accessToken);

      expect(result.response.status).toBe(200);
      expect(result.body.data.skill.id).toBe(lockedSkillId);
      expect(result.body.data.skill.status).toBe("locked");
    } finally {
      context.cleanup();
    }
  });

  test("returns skill_not_found for unknown ids", async () => {
    const context = createTestAppContext();

    try {
      const user = await registerUser(context.app, "skills-missing@example.com");
      const response = await getRequest(
        context.app,
        `/api/skills/${missingSkillId}`,
        user.accessToken,
      );
      const body = await parseJson<ApiErrorResponse>(response);

      expect(response.status).toBe(404);
      expect(body.error.code).toBe("skill_not_found");
    } finally {
      context.cleanup();
    }
  });

  test("isolates skill progress by authenticated user", async () => {
    const context = createTestAppContext();

    try {
      const firstUser = await registerUser(context.app, "skills-user-one@example.com");
      const secondUser = await registerUser(context.app, "skills-user-two@example.com");
      completeDiagnosisForUser(context, firstUser.userId);
      insertCompletedPrerequisitesForLockedSkill(context, firstUser.userId, 4);

      const firstUserResult = await getSkills(context.app, firstUser.accessToken);
      const secondUserResult = await getSkills(context.app, secondUser.accessToken);

      expect(firstUserResult.response.status).toBe(200);
      expect(secondUserResult.response.status).toBe(200);
      expect(findSkill(firstUserResult.body.data.skills, lockedSkillId).status).toBe(
        "available",
      );
      expect(findSkill(secondUserResult.body.data.skills, lockedSkillId).status).toBe(
        "locked",
      );
    } finally {
      context.cleanup();
    }
  });
});
