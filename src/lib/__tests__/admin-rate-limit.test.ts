import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginFailures,
  __resetLoginRateLimitForTests,
  __loginRateLimitConfig,
} from "../admin-rate-limit.ts";

describe("admin-rate-limit", () => {
  beforeEach(() => {
    __resetLoginRateLimitForTests();
  });

  it("allows attempts under the limit", () => {
    const key = "1.2.3.4:admin";
    for (let i = 0; i < __loginRateLimitConfig.MAX_ATTEMPTS - 1; i++) {
      recordLoginFailure(key);
      assert.equal(checkLoginRateLimit(key).allowed, true);
    }
  });

  it("blocks after MAX_ATTEMPTS failures", () => {
    const key = "5.6.7.8:admin";
    for (let i = 0; i < __loginRateLimitConfig.MAX_ATTEMPTS; i++) {
      recordLoginFailure(key);
    }
    const result = checkLoginRateLimit(key);
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.ok(result.retryAfterSec > 0);
    }
  });

  it("clears failures after successful login path", () => {
    const key = "9.9.9.9:admin";
    for (let i = 0; i < __loginRateLimitConfig.MAX_ATTEMPTS; i++) {
      recordLoginFailure(key);
    }
    assert.equal(checkLoginRateLimit(key).allowed, false);
    clearLoginFailures(key);
    assert.equal(checkLoginRateLimit(key).allowed, true);
  });

  it("isolates keys from each other", () => {
    const a = "10.0.0.1:alice";
    const b = "10.0.0.1:bob";
    for (let i = 0; i < __loginRateLimitConfig.MAX_ATTEMPTS; i++) {
      recordLoginFailure(a);
    }
    assert.equal(checkLoginRateLimit(a).allowed, false);
    assert.equal(checkLoginRateLimit(b).allowed, true);
  });
});
