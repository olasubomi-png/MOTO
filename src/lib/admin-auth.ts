/**
 * Server-only admin session authentication.
 * Credentials and secrets never reach the client bundle.
 */
import "server-only";

import { cookies } from "next/headers";
import {
  createSessionTokenWithSecret,
  parseSessionTokenWithSecret,
  verifyCredentials,
  type AdminSession,
} from "./admin-auth-crypto";

export type { AdminSession };
export const ADMIN_SESSION_COOKIE = "moto_admin_session";
const SESSION_TTL_SEC = 12 * 60 * 60;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set (min 16 characters) for admin authentication."
    );
  }
  return secret;
}

function getAdminCredentials(): { username: string; password: string } {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD must be set for admin authentication."
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

export async function setAdminSessionCookie(username: string): Promise<void> {
  const token = createSessionToken(username);
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
