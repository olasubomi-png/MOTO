/**
 * Pure helpers for reading admin env vars (no server-only).
 * Used by admin-auth.ts and unit tests.
 */
import { existsSync } from "node:fs";
import path from "node:path";

let envBootstrapAttempted = false;

export function ensureAdminEnvLoaded(): void {
  if (envBootstrapAttempted) return;
  envBootstrapAttempted = true;

  const hasUser = Boolean(process.env.ADMIN_USERNAME?.trim());
  const hasPass = Boolean(process.env.ADMIN_PASSWORD?.trim());
  const hasSecret = Boolean(process.env.ADMIN_SESSION_SECRET?.trim());
  if (hasUser && hasPass && hasSecret) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require("dotenv") as {
      config: (opts?: { path?: string }) => unknown;
    };
    const cwd = process.cwd();
    for (const file of [path.join(cwd, ".env.local"), path.join(cwd, ".env")]) {
      if (existsSync(file)) dotenv.config({ path: file });
    }
  } catch {
    /* host-injected env only */
  }
}

/** @internal tests */
export function __resetAdminEnvBootstrapForTests(): void {
  envBootstrapAttempted = false;
}

export function readAdminEnv(name: string): string | undefined {
  ensureAdminEnvLoaded();
  const raw = process.env[name];
  if (raw === undefined || raw === null) return undefined;
  let trimmed = String(raw).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

export function getAdminAuthEnvStatus(): {
  hasUsername: boolean;
  hasPassword: boolean;
  hasSessionSecret: boolean;
  sessionSecretLength: number;
} {
  const secret = readAdminEnv("ADMIN_SESSION_SECRET");
  return {
    hasUsername: Boolean(readAdminEnv("ADMIN_USERNAME")),
    hasPassword: Boolean(readAdminEnv("ADMIN_PASSWORD")),
    hasSessionSecret: Boolean(secret),
    sessionSecretLength: secret?.length ?? 0,
  };
}
