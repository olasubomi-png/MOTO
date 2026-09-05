import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema.ts";

export type AppDatabase = NeonHttpDatabase<typeof schema>;

let _db: AppDatabase | null = null;

/**
 * Lazy Drizzle client for Neon (HTTP).
 * Requires DATABASE_URL in the environment.
 */
export function getDb(): AppDatabase {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Configure a Neon PostgreSQL connection string."
    );
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export * from "./schema.ts";
