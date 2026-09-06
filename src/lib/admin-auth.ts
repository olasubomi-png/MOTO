/**
 * Server-only admin session authentication.
 * Credentials and secrets never reach the client bundle.
 */
import "server-only";

import { cookies, headers } from "next/headers";
import {
  createSessionTokenWithSecret,
  parseSessionTokenWithSecret,
  verifyCredentials,
  type AdminSession,
} from "./admin-auth-crypto";
import {
  readAdminEnv,
  getAdminAuthEnvStatus,
} from "./admin-auth-env";

export { getAdminAuthEnvStatus };

export type { AdminSession };
export const ADMIN_SESSION_COOKIE = "moto_admin_session";
const SESSION_TTL_SEC = 12 * 60 * 60;

/** Typed config errors — never include secret values in messages. */
export class AdminAuthConfigError extends Error {
  readonly code:
    | "MISSING_CREDENTIALS"
    | "MISSING_SESSION_SECRET"
    | "WEAK_SESSION_SECRET";

  constructor(
    code: AdminAuthConfigError["code"],
    message: string
  ) {
    super(message);
    this.name = "AdminAuthConfigError";
    this.code = code;
  }
}

function getSecret(): string {
  const secret = readAdminEnv("ADMIN_SESSION_SECRET");
  if (!secret) {
    throw new AdminAuthConfigError(
      "MISSING_SESSION_SECRET",
      "ADMIN_SESSION_SECRET is not set on the server."
    );
  }
  if (secret.length < 16) {
    throw new AdminAuthConfigError(
      "WEAK_SESSION_SECRET",
      "ADMIN_SESSION_SECRET must be at least 16 characters."
    );
  }
  return secret;
}

function getAdminCredentials(): { username: string; password: string } {
  const username = readAdminEnv("ADMIN_USERNAME");
  const password = readAdminEnv("ADMIN_PASSWORD");
  if (!username || !password) {
    throw new AdminAuthConfigError(
      "MISSING_CREDENTIALS",
      "ADMIN_USERNAME and ADMIN_PASSWORD must be set on the server."
    );
  }
  return { username, password };
}

export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  const creds = getAdminCredentials();
  return verifyCredentials(
    username,
    password,
    creds.username,
    creds.password
  );
}

export function createSessionToken(username: string): string {
  return createSessionTokenWithSecret(username, getSecret());
}

export function parseSessionToken(token: string): AdminSession | null {
  return parseSessionTokenWithSecret(token, getSecret());
}

async function shouldUseSecureCookie(): Promise<boolean> {
  if (process.env.ADMIN_COOKIE_SECURE === "1") return true;
  if (process.env.ADMIN_COOKIE_SECURE === "0") return false;
  try {
    const h = await headers();
    const proto = (h.get("x-forwarded-proto") || h.get("x-forwarded-protocol") || "")
      .split(",")[0]
      ?.trim()
      .toLowerCase();
    if (proto === "https") return true;
    if (proto === "http") return false;
  } catch {
    /* no request context */
  }
  // Default: secure in production builds when protocol is unknown
  return process.env.NODE_ENV === "production";
}

export async function setAdminSessionCookie(username: string): Promise<void> {
  const token = createSessionToken(username);
  const jar = await cookies();
  const secure = await shouldUseSecureCookie();

  jar.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  const secure = await shouldUseSecureCookie();
  jar.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const jar = await cookies();
    const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) return null;
    return parseSessionToken(token);
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
