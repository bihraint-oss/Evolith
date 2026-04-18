import { resolve } from "node:path";

import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { loadEnv } from "../config/env";
import { createDatabaseClient } from "./client";

const migrationsFolder = resolve(import.meta.dir, "migrations");

export interface RunMigrationsOptions {
  databaseFile: string;
}

export function runMigrations(options: RunMigrationsOptions): string {
  const client = createDatabaseClient({
    databaseFile: options.databaseFile,
  });

  try {
    migrate(client.db, { migrationsFolder });
    return client.databaseFile;
  } finally {
    client.close();
  }
}

if (import.meta.main) {
  const env = loadEnv();
  const databaseFile = runMigrations({ databaseFile: env.DATABASE_FILE });

  console.info(`Applied migrations to ${databaseFile}`);
}
