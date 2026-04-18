import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

import { Database } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

import { schema } from "./schema";

const repositoryRoot = resolve(import.meta.dir, "../../../..");

export interface DatabaseClientOptions {
  databaseFile: string;
  create?: boolean;
  readonly?: boolean;
  readwrite?: boolean;
}

export interface DatabaseClient {
  databaseFile: string;
  sqlite: Database;
  db: AppDatabase;
  close: () => void;
}

export type AppDatabase = BunSQLiteDatabase<typeof schema>;

export function resolveDatabaseFile(databaseFile: string): string {
  if (databaseFile === ":memory:" || isAbsolute(databaseFile)) {
    return databaseFile;
  }

  return resolve(repositoryRoot, databaseFile);
}

export function createDatabaseClient(
  options: DatabaseClientOptions,
): DatabaseClient {
  const databaseFile = resolveDatabaseFile(options.databaseFile);

  if (databaseFile !== ":memory:") {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }

  const sqlite = new Database(databaseFile, {
    create: options.create ?? true,
    readonly: options.readonly ?? false,
    readwrite: options.readwrite ?? !options.readonly,
  });

  sqlite.exec("PRAGMA foreign_keys = ON;");

  const db = drizzle(sqlite, { schema });

  return {
    databaseFile,
    sqlite,
    db,
    close: () => {
      sqlite.close();
    },
  };
}
