/**
 * Seed vehicles from data/vehicles.json into Neon.
 *
 * Default: insert missing IDs only — does NOT overwrite existing rows
 * (preserves admin edits). Does NOT delete vehicles absent from JSON.
 *
 * Force overwrite of matching IDs:
 *   SEED_FORCE=1 DATABASE_URL=... pnpm db:seed
 *
 * Run via tsx (see package.json) so TypeScript path resolution works on Node 22 ESM.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  getVehicleById,
  createVehicle,
  upsertVehicle,
} from "../src/lib/vehicle-repository-core";
import type { Vehicle } from "../src/lib/vehicle-types";
import { validateVehicle } from "../src/lib/vehicle-validation";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const force =
    process.env.SEED_FORCE === "1" || process.env.SEED_FORCE === "true";
  const file = path.join(process.cwd(), "data", "vehicles.json");
  const raw = JSON.parse(readFileSync(file, "utf-8")) as unknown;
  if (!Array.isArray(raw)) {
    console.error("vehicles.json must be an array");
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;
  let updated = 0;
  let invalid = 0;

  for (const item of raw) {
    const issues = validateVehicle(item);
    if (issues.length > 0) {
      console.warn(
        "Skip invalid record:",
        issues.map((i) => `${i.field}: ${i.message}`).join("; ")
      );
      invalid += 1;
      continue;
    }
    const vehicle = item as Vehicle;
    const existing = await getVehicleById(vehicle.id);

    if (existing && !force) {
      console.log(
        `Skip existing ${vehicle.id} — ${vehicle.year} ${vehicle.make} ${vehicle.model} (admin data preserved)`
      );
      skipped += 1;
      continue;
    }

    if (existing && force) {
      await upsertVehicle(vehicle);
      console.log(
        `Force-updated ${vehicle.id} — ${vehicle.year} ${vehicle.make} ${vehicle.model}`
      );
      updated += 1;
      continue;
    }

    await createVehicle({ ...vehicle, id: vehicle.id });
    console.log(
      `Inserted ${vehicle.id} — ${vehicle.year} ${vehicle.make} ${vehicle.model}`
    );
    inserted += 1;
  }

  console.log(
    `Done. inserted=${inserted}, skipped_existing=${skipped}, force_updated=${updated}, invalid=${invalid}. force=${force}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
