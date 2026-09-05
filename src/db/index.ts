import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type AppDatabase = NeonHttpDatabase<typeof schema>;

let _db: AppDatabase | null = null;

/**
 * Lazy Drizzle client for Neon (HTTP driver).
 * Uses DATABASE_URL only — never NEXT_PUBLIC_*.
 */
export function getDb(): AppDatabase {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url || !url.trim()) {
    throw new Error(
      "DATABASE_URL is not set. Configure a Neon PostgreSQL connection string in the server environment."
    );
  }
  if (url.includes("NEXT_PUBLIC")) {
    throw new Error("Refusing to use a public-prefixed database URL.");
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

/** Reset cached client (tests only). */
export function __resetDbForTests(): void {
  _db = null;
}

export * from "./schema";
