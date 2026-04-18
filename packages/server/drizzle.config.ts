import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "drizzle-kit";

import { loadEnv } from "./src/config/env";

const packageRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(packageRoot, "../..");
const env = loadEnv(process.env);

function resolveConfigDatabaseFile(databaseFile: string): string {
  if (databaseFile === ":memory:" || isAbsolute(databaseFile)) {
    return databaseFile;
  }

  return resolve(repositoryRoot, databaseFile);
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: resolveConfigDatabaseFile(env.DATABASE_FILE),
  },
});
