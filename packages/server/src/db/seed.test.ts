import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { createDatabaseClient } from "./client";
import { runMigrations } from "./migrate";
import { AI_DEVELOPER_SKILL_TREE_NODE_COUNT } from "./seed-data/skill-tree";
import { seedSkillTree } from "./seed";
import { skillNodes } from "./schema";

function createSeedTestDatabaseFile(): { cleanup: () => void; databaseFile: string } {
  const directory = mkdtempSync(join(tmpdir(), "evolith-seed-test-"));

  return {
    databaseFile: join(directory, "test.db"),
    cleanup: () => {
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

describe("seedSkillTree", () => {
  test("inserts 25 nodes, stays idempotent, and preserves valid prerequisites", () => {
    const testDatabase = createSeedTestDatabaseFile();

    runMigrations({ databaseFile: testDatabase.databaseFile });

    const dbClient = createDatabaseClient({
      databaseFile: testDatabase.databaseFile,
    });

    try {
      const firstRunCount = seedSkillTree(dbClient.db);
      const secondRunCount = seedSkillTree(dbClient.db);
      const rows = dbClient.db.select().from(skillNodes).all();
      const rowIds = new Set(rows.map((row) => row.id));

      expect(firstRunCount).toBe(AI_DEVELOPER_SKILL_TREE_NODE_COUNT);
      expect(secondRunCount).toBe(AI_DEVELOPER_SKILL_TREE_NODE_COUNT);
      expect(rows).toHaveLength(AI_DEVELOPER_SKILL_TREE_NODE_COUNT);
      expect(rowIds.size).toBe(AI_DEVELOPER_SKILL_TREE_NODE_COUNT);

      rows.forEach((row) => {
        expect(Array.isArray(row.prerequisites)).toBe(true);

        row.prerequisites.forEach((prerequisiteId) => {
          expect(rowIds.has(prerequisiteId)).toBe(true);
        });
      });
    } finally {
      dbClient.close();
      testDatabase.cleanup();
    }
  });
});
