/**
 * Pure admin session crypto (no Next.js / server-only).
 * Used by admin-auth.ts and unit tests.
 */
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type SessionPayload = {
  sub: string;
  exp: number;
  iat: number;
  nonce: string;
};

export type AdminSession = {
  username: string;
  expiresAt: number;
};

export function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function encodeSession(payload: SessionPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  return `${body}.${sign(body, secret)}`;
}

export function decodeSession(
  token: string,
  secret: string
): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  const expected = sign(body, secret);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const json = Buffer.from(body, "base64url").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number"
    ) {
      return null;
    }
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function createSessionTokenWithSecret(
  username: string,
  secret: string
): string {
  const now = Date.now();
  return encodeSession(
    {
      sub: username,
      iat: now,
      exp: now + SESSION_TTL_MS,
      nonce: randomBytes(8).toString("hex"),
    },
    secret
  );
}

export function parseSessionTokenWithSecret(
  token: string,
  secret: string
): AdminSession | null {
  const payload = decodeSession(token, secret);
  if (!payload) return null;
  return { username: payload.sub, expiresAt: payload.exp };
}

export function verifyCredentials(
  username: string,
  password: string,
  expectedUser: string,
  expectedPass: string
): boolean {
  return (
    safeEqualString(username, expectedUser) &&
    safeEqualString(password, expectedPass)
  );
}
