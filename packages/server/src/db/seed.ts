import { sql } from "drizzle-orm";

import { loadEnv } from "../config/env";
import { type AppDatabase, createDatabaseClient } from "./client";
import {
  AI_DEVELOPER_SKILL_TREE_NODE_COUNT,
  aiDeveloperSkillTree,
  validateAiDeveloperSkillTree,
} from "./seed-data/skill-tree";
import { skillNodes } from "./schema";

export interface RunSeedOptions {
  databaseFile: string;
}

export interface SeedResult {
  databaseFile: string;
  expectedNodeCount: number;
  totalNodeCount: number;
}

export function seedSkillTree(db: AppDatabase): number {
  validateAiDeveloperSkillTree();

  db.transaction((tx) => {
    aiDeveloperSkillTree.forEach((node) => {
      tx.insert(skillNodes)
        .values({
          id: node.id,
          name: node.name,
          description: node.description,
          dimension: node.dimension,
          difficulty: node.difficulty,
          prerequisites: [...node.prerequisiteIds],
          completionCriteria: node.completionCriteria,
        })
        .onConflictDoUpdate({
          target: skillNodes.id,
          set: {
            name: node.name,
            description: node.description,
            dimension: node.dimension,
            difficulty: node.difficulty,
            prerequisites: [...node.prerequisiteIds],
            completionCriteria: node.completionCriteria,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        })
        .run();
    });
  });

  const result = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(skillNodes)
    .get();

  return Number(result?.count ?? 0);
}

export function runSeed(options: RunSeedOptions): SeedResult {
  const client = createDatabaseClient({
    databaseFile: options.databaseFile,
  });

  try {
    const totalNodeCount = seedSkillTree(client.db);

    return {
      databaseFile: client.databaseFile,
      expectedNodeCount: AI_DEVELOPER_SKILL_TREE_NODE_COUNT,
      totalNodeCount,
    };
  } finally {
    client.close();
  }
}

if (import.meta.main) {
  const env = loadEnv();
  const result = runSeed({ databaseFile: env.DATABASE_FILE });

  console.info(
    `Seeded ${result.expectedNodeCount} skill nodes into ${result.databaseFile}; total rows: ${result.totalNodeCount}`,
  );
}
