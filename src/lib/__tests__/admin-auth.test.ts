import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createSessionTokenWithSecret,
  parseSessionTokenWithSecret,
  verifyCredentials,
} from "../admin-auth-crypto.ts";

const SECRET = "test-secret-at-least-sixteen-chars";

describe("admin-auth-crypto", () => {
  it("accepts valid credentials", () => {
    assert.equal(
      verifyCredentials("admin", "secret-pass", "admin", "secret-pass"),
      true
    );
  });

  it("rejects invalid credentials", () => {
    assert.equal(
      verifyCredentials("admin", "wrong", "admin", "secret-pass"),
      false
    );
  });

  it("creates and parses a valid session token", () => {
    const token = createSessionTokenWithSecret("admin", SECRET);
    const session = parseSessionTokenWithSecret(token, SECRET);
    assert.ok(session);
    assert.equal(session!.username, "admin");
    assert.ok(session!.expiresAt > Date.now());
  });

  it("rejects tampered session tokens", () => {
    const token = createSessionTokenWithSecret("admin", SECRET);
    const tampered = token.slice(0, -4) + "xxxx";
    assert.equal(parseSessionTokenWithSecret(tampered, SECRET), null);
  });

  it("rejects malformed tokens", () => {
    assert.equal(parseSessionTokenWithSecret("", SECRET), null);
    assert.equal(parseSessionTokenWithSecret("onlyonepart", SECRET), null);
  });
});
