/**
 * Best-effort login rate limiting for serverless.
 * In-memory per isolate — no Redis required.
 * Limits are per process instance; still blocks rapid sequential abuse
 * on a warm instance and slows credential stuffing.
 */

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

type Bucket = {
  count: number;
  windowStart: number;
};

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/** Module-level map survives across warm invocations in the same isolate */
const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 500) return;
  for (const [key, b] of buckets) {
    if (now - b.windowStart > WINDOW_MS) buckets.delete(key);
  }
}

/**
 * Check whether a login attempt is allowed for this key
 * (typically `ip:username` or `ip`).
 */
export function checkLoginRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  prune(now);
  const b = buckets.get(key);
  if (!b) return { allowed: true };
  if (now - b.windowStart > WINDOW_MS) {
    buckets.delete(key);
    return { allowed: true };
  }
  if (b.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((b.windowStart + WINDOW_MS - now) / 1000)
    );
    return { allowed: false, retryAfterSec };
  }
  return { allowed: true };
}

/** Record a failed login attempt. */
export function recordLoginFailure(key: string): void {
  const now = Date.now();
  prune(now);
  const b = buckets.get(key);
  if (!b || now - b.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return;
  }
  b.count += 1;
}

/** Clear failures after successful login. */
export function clearLoginFailures(key: string): void {
  buckets.delete(key);
}

/** Test helper — reset all buckets */
export function __resetLoginRateLimitForTests(): void {
  buckets.clear();
}

export const __loginRateLimitConfig = {
  WINDOW_MS,
  MAX_ATTEMPTS,
} as const;
