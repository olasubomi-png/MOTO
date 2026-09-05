/**
 * Idempotent seed: upsert vehicles from data/vehicles.json into Neon.
 * Does NOT delete existing vehicles that are absent from JSON.
 *
 * Usage: DATABASE_URL=... npm run db:seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { readFileSync } from "fs";
import path from "path";
import { upsertVehicle } from "../src/lib/vehicle-repository";
import type { Vehicle } from "../src/lib/vehicle-types";
import { validateVehicle } from "../src/lib/vehicle-validation";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const file = path.join(process.cwd(), "data", "vehicles.json");
  const raw = JSON.parse(readFileSync(file, "utf-8")) as unknown;
  if (!Array.isArray(raw)) {
    console.error("vehicles.json must be an array");
    process.exit(1);
  }

  let ok = 0;
  let skipped = 0;
  for (const item of raw) {
    const issues = validateVehicle(item);
    if (issues.length > 0) {
      console.warn(
        "Skip invalid record:",
        issues.map((i) => `${i.field}: ${i.message}`).join("; ")
      );
      skipped += 1;
      continue;
    }
    const vehicle = item as Vehicle;
    await upsertVehicle(vehicle);
    console.log(
      `Upserted ${vehicle.id} — ${vehicle.year} ${vehicle.make} ${vehicle.model}`
    );
    ok += 1;
  }

  console.log(`Done. Upserted ${ok}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
