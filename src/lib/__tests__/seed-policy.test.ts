import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Documents seed policy without requiring DATABASE_URL.
 * Implementation lives in scripts/seed-vehicles.ts.
 */
function decideSeedAction(
  existing: boolean,
  force: boolean
): "insert" | "skip" | "force-update" {
  if (existing && !force) return "skip";
  if (existing && force) return "force-update";
  return "insert";
}

describe("seed policy", () => {
  it("skips existing records by default", () => {
    assert.equal(decideSeedAction(true, false), "skip");
  });

  it("inserts when record is missing", () => {
    assert.equal(decideSeedAction(false, false), "insert");
    assert.equal(decideSeedAction(false, true), "insert");
  });

  it("force-updates only when SEED_FORCE is enabled", () => {
    assert.equal(decideSeedAction(true, true), "force-update");
  });

  it("parses SEED_FORCE flags", () => {
    const isForce = (v: string | undefined) => v === "1" || v === "true";
    assert.equal(isForce(undefined), false);
    assert.equal(isForce("0"), false);
    assert.equal(isForce("1"), true);
    assert.equal(isForce("true"), true);
  });
});
