import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  pendingLabel,
  featureButtonLabel,
  messageFromActionResult,
  unexpectedActionErrorMessage,
  DELETE_CONFIRM_COPY,
} from "../admin-action-feedback.ts";

describe("admin-action-feedback", () => {
  it("pending labels for feature toggle", () => {
    assert.equal(pendingLabel("feature", { featured: false }), "Featuring…");
    assert.equal(pendingLabel("feature", { featured: true }), "Unfeaturing…");
    assert.equal(pendingLabel("unpublish"), "Unpublishing…");
    assert.equal(pendingLabel("delete"), "Deleting…");
    assert.equal(pendingLabel("availability"), "Saving…");
  });

  it("idle feature button labels", () => {
    assert.equal(featureButtonLabel(true), "Unfeature");
    assert.equal(featureButtonLabel(false), "Feature");
  });

  it("maps successful action results", () => {
    const m = messageFromActionResult({ ok: true }, "Marked as featured.");
    assert.equal(m.type, "ok");
    assert.equal(m.message, "Marked as featured.");
  });

  it("maps failed action results with safe message", () => {
    const m = messageFromActionResult(
      { ok: false, error: "Vehicle not found." },
      "ok"
    );
    assert.equal(m.type, "err");
    assert.equal(m.message, "Vehicle not found.");
  });

  it("strips secret-like error strings", () => {
    const m = messageFromActionResult(
      {
        ok: false,
        error: "connection failed postgres://user:password@host/db",
      },
      "ok"
    );
    assert.equal(m.type, "err");
    assert.equal(m.message.includes("password"), false);
    assert.equal(m.message.includes("postgres"), false);
  });

  it("unexpected catch message is generic", () => {
    const msg = unexpectedActionErrorMessage();
    assert.equal(msg.includes("password"), false);
    assert.ok(msg.length > 0);
  });

  it("delete confirmation copy prefers unpublish", () => {
    assert.ok(DELETE_CONFIRM_COPY.toLowerCase().includes("unpublish"));
    assert.ok(DELETE_CONFIRM_COPY.toLowerCase().includes("permanently"));
  });

  it("empty error falls back", () => {
    const m = messageFromActionResult({ ok: false }, "ok");
    assert.equal(m.type, "err");
    assert.ok(m.message.length > 0);
  });
});
