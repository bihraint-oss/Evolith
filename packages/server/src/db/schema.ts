import type {
  CognitiveDimensionScores,
  DiagnosisAnswer,
  DiagnosisQuestion,
  EntityId,
  SkillDifficulty,
} from "@evolith/shared";
import {
  cognitiveDimensions,
  userProgressStatuses,
} from "@evolith/shared";
import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const createIdColumn = (name: string) =>
  text(name)
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey();

const createTimestampColumn = (name: string) =>
  text(name).notNull().default(sql`CURRENT_TIMESTAMP`);

const createJsonTextColumn = <TData>(name: string) =>
  text(name, { mode: "json" }).$type<TData>();

const createTimestampColumns = () => ({
  createdAt: createTimestampColumn("created_at"),
  updatedAt: createTimestampColumn("updated_at"),
});

export const users = sqliteTable(
  "users",
  {
    id: createIdColumn("id"),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    ...createTimestampColumns(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const cognitiveProfiles = sqliteTable(
  "cognitive_profiles",
  {
    id: createIdColumn("id"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    creativity: integer("creativity").notNull().default(0),
    imagination: integer("imagination").notNull().default(0),
    promptPrecision: integer("prompt_precision").notNull().default(0),
    systemDecomposition: integer("system_decomposition").notNull().default(0),
    aiOrchestration: integer("ai_orchestration").notNull().default(0),
    lastDiagnosedAt: text("last_diagnosed_at"),
    ...createTimestampColumns(),
  },
  (table) => [uniqueIndex("cognitive_profiles_user_id_unique").on(table.userId)],
);

export const skillNodes = sqliteTable(
  "skill_nodes",
  {
    id: createIdColumn("id"),
    name: text("name").notNull(),
    description: text("description").notNull(),
    dimension: text("dimension", { enum: cognitiveDimensions }).notNull(),
    difficulty: integer("difficulty").$type<SkillDifficulty>().notNull(),
    prerequisites: createJsonTextColumn<EntityId[]>("prerequisites").notNull(),
    completionCriteria: text("completion_criteria").notNull(),
    ...createTimestampColumns(),
  },
  (table) => [
    check("skill_nodes_difficulty_check", sql`${table.difficulty} between 1 and 5`),
  ],
);

export const userProgress = sqliteTable(
  "user_progress",
  {
    id: createIdColumn("id"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillNodeId: text("skill_node_id")
      .notNull()
      .references(() => skillNodes.id, { onDelete: "cascade" }),
    status: text("status", { enum: userProgressStatuses }).notNull(),
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    score: integer("score"),
    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("user_progress_user_id_skill_node_id_unique").on(
      table.userId,
      table.skillNodeId,
    ),
  ],
);

export const diagnosisSessions = sqliteTable("diagnosis_sessions", {
  id: createIdColumn("id"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questions: createJsonTextColumn<DiagnosisQuestion[]>("questions").notNull(),
  answers: createJsonTextColumn<DiagnosisAnswer[]>("answers").notNull(),
  profileSnapshot:
    createJsonTextColumn<CognitiveDimensionScores>("profile_snapshot"),
  completedAt: text("completed_at"),
  ...createTimestampColumns(),
});

export const schema = {
  users,
  cognitiveProfiles,
  skillNodes,
  userProgress,
  diagnosisSessions,
};

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type CognitiveProfileRow = typeof cognitiveProfiles.$inferSelect;
export type NewCognitiveProfileRow = typeof cognitiveProfiles.$inferInsert;
export type SkillNodeRow = typeof skillNodes.$inferSelect;
export type NewSkillNodeRow = typeof skillNodes.$inferInsert;
export type UserProgressRow = typeof userProgress.$inferSelect;
export type NewUserProgressRow = typeof userProgress.$inferInsert;
export type DiagnosisSessionRow = typeof diagnosisSessions.$inferSelect;
export type NewDiagnosisSessionRow = typeof diagnosisSessions.$inferInsert;
