/**
 * Pure helpers for reading admin env vars (no server-only).
 * Used by admin-auth.ts and unit tests.
 *
 * Filesystem note: dotenv is loaded with static relative paths only
 * (".env.local", ".env"). We intentionally avoid existsSync() and
 * path.join(process.cwd(), …) so Turbopack does not treat this as
 * dynamic project-wide filesystem access during the production build.
 * dotenv.config() is a no-op when the file is absent.
 */
let envBootstrapAttempted = false;
/** When true, skip filesystem dotenv fallback (test isolation only). */
let fileFallbackDisabledForTests = false;

export function ensureAdminEnvLoaded(): void {
  if (envBootstrapAttempted) return;
  envBootstrapAttempted = true;

  const hasUser = Boolean(process.env.ADMIN_USERNAME?.trim());
  const hasPass = Boolean(process.env.ADMIN_PASSWORD?.trim());
  const hasSecret = Boolean(process.env.ADMIN_SESSION_SECRET?.trim());
  if (hasUser && hasPass && hasSecret) return;

  if (fileFallbackDisabledForTests) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require("dotenv") as {
      config: (opts?: { path?: string }) => unknown;
    };
    // Static relative paths only — same resolution as path.join(cwd, name)
    // when the process cwd is the project root (Next.js / PM2 standard).
    dotenv.config({ path: ".env.local" });
    dotenv.config({ path: ".env" });
  } catch {
    /* host-injected env only */
  }
}

/** @internal tests — reset bootstrap flag; re-enables file fallback */
export function __resetAdminEnvBootstrapForTests(): void {
  envBootstrapAttempted = false;
  fileFallbackDisabledForTests = false;
}

/**
 * @internal tests — mark env bootstrap complete without reading .env files,
 * so missing process.env values stay missing for the assertion.
 */
export function __disableAdminEnvFileFallbackForTests(): void {
  fileFallbackDisabledForTests = true;
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
