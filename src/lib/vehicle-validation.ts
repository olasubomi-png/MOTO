import type { Vehicle, VehicleAvailability } from "./vehicle-types";


const VALID_AVAILABILITY: VehicleAvailability[] = [
  "available",
  "reserved",
  "sold",
  "unpublished",
];

export type VehicleValidationIssue = {
  field: string;
  message: string;
};

export function isValidIsoDate(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  const t = Date.parse(value);
  return !Number.isNaN(t);
}

/** Validate a vehicle record. Returns issues (empty = valid). */
export function validateVehicle(
  input: unknown,
  opts?: { requireId?: boolean }
): VehicleValidationIssue[] {
  const issues: VehicleValidationIssue[] = [];
  if (!input || typeof input !== "object") {
    return [{ field: "_root", message: "Vehicle must be an object" }];
  }
  const v = input as Record<string, unknown>;

  if (opts?.requireId !== false) {
    if (typeof v.id !== "string" || !v.id.trim()) {
      issues.push({ field: "id", message: "id is required" });
    }
  }
  if (typeof v.make !== "string" || !v.make.trim()) {
    issues.push({ field: "make", message: "make is required" });
  }
  if (typeof v.model !== "string" || !v.model.trim()) {
    issues.push({ field: "model", message: "model is required" });
  }
  if (typeof v.year !== "number" || v.year < 1980 || v.year > 2100) {
    issues.push({ field: "year", message: "year must be a valid number" });
  }
  if (typeof v.price !== "number" || !Number.isFinite(v.price) || v.price < 0) {
    issues.push({ field: "price", message: "price must be a non-negative number" });
  }
  if (typeof v.currency !== "string" || !v.currency.trim()) {
    issues.push({ field: "currency", message: "currency is required" });
  }
  if (typeof v.mileage !== "number" || v.mileage < 0) {
    issues.push({ field: "mileage", message: "mileage must be a non-negative number" });
  }
  if (typeof v.fuel !== "string" || !v.fuel.trim()) {
    issues.push({ field: "fuel", message: "fuel is required" });
  }
  if (typeof v.transmission !== "string" || !v.transmission.trim()) {
    issues.push({ field: "transmission", message: "transmission is required" });
  }
  if (typeof v.engine !== "string") {
    issues.push({ field: "engine", message: "engine is required" });
  }
  if (typeof v.bodyType !== "string" || !v.bodyType.trim()) {
    issues.push({ field: "bodyType", message: "bodyType is required" });
  }
  if (typeof v.condition !== "string") {
    issues.push({ field: "condition", message: "condition is required" });
  }
  if (typeof v.description !== "string") {
    issues.push({ field: "description", message: "description is required" });
  }
  if (!Array.isArray(v.features)) {
    issues.push({ field: "features", message: "features must be an array" });
  }
  if (typeof v.location !== "string") {
    issues.push({ field: "location", message: "location is required" });
  }
  if (
    typeof v.availability !== "string" ||
    !VALID_AVAILABILITY.includes(v.availability as VehicleAvailability)
  ) {
    issues.push({
      field: "availability",
      message: `availability must be one of: ${VALID_AVAILABILITY.join(", ")}`,
    });
  }
  if (typeof v.featured !== "boolean") {
    issues.push({ field: "featured", message: "featured must be a boolean" });
  }
  if (!Array.isArray(v.images)) {
    issues.push({ field: "images", message: "images must be an array of strings" });
  } else if (v.images.some((img) => typeof img !== "string")) {
    issues.push({ field: "images", message: "each image must be a string path" });
  }
  if (v.createdAt !== undefined && !isValidIsoDate(v.createdAt)) {
    issues.push({ field: "createdAt", message: "createdAt must be a valid ISO date" });
  }
  if (v.updatedAt !== undefined && !isValidIsoDate(v.updatedAt)) {
    issues.push({ field: "updatedAt", message: "updatedAt must be a valid ISO date" });
  }

  return issues;
}

export function assertValidVehicle(input: unknown): asserts input is Vehicle {
  const issues = validateVehicle(input);
  if (issues.length > 0) {
    throw new Error(
      `Invalid vehicle: ${issues.map((i) => `${i.field}: ${i.message}`).join("; ")}`
    );
  }
}

/** Deduplicate IDs; keep first occurrence. */
export function dedupeVehiclesById(vehicles: Vehicle[]): Vehicle[] {
  const seen = new Set<string>();
  const out: Vehicle[] = [];
  for (const v of vehicles) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out;
}
