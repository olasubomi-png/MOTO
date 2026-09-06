import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  readAdminEnv,
  getAdminAuthEnvStatus,
  __resetAdminEnvBootstrapForTests,
  __disableAdminEnvFileFallbackForTests,
} from "../admin-auth-env.ts";

describe("admin-auth-env", () => {
  const keys = [
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "ADMIN_SESSION_SECRET",
  ] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of keys) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    __resetAdminEnvBootstrapForTests();
  });

  afterEach(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    __resetAdminEnvBootstrapForTests();
  });

  it("reads trimmed env values", () => {
    process.env.ADMIN_USERNAME = "  admin  ";
    assert.equal(readAdminEnv("ADMIN_USERNAME"), "admin");
  });

  it("strips wrapping quotes", () => {
    process.env.ADMIN_PASSWORD = '"secret-value"';
    assert.equal(readAdminEnv("ADMIN_PASSWORD"), "secret-value");
  });

  it("reports env status without exposing secrets", () => {
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "password-here";
    process.env.ADMIN_SESSION_SECRET = "x".repeat(32);
    const status = getAdminAuthEnvStatus();
    assert.equal(status.hasUsername, true);
    assert.equal(status.hasPassword, true);
    assert.equal(status.hasSessionSecret, true);
    assert.equal(status.sessionSecretLength, 32);
    assert.equal(JSON.stringify(status).includes("password-here"), false);
    assert.equal(JSON.stringify(status).includes("x".repeat(32)), false);
  });

  it("detects missing vars", () => {
    // Isolate from real .env.local on the host without weakening production fallback
    __disableAdminEnvFileFallbackForTests();
    const status = getAdminAuthEnvStatus();
    assert.equal(status.hasUsername, false);
    assert.equal(status.hasPassword, false);
    assert.equal(status.hasSessionSecret, false);
    assert.equal(status.sessionSecretLength, 0);
  });
});
