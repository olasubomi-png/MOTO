import type { Vehicle, VehicleAvailability } from "./vehicle-types";


const VALID_AVAILABILITY: VehicleAvailability[] = [
  "available",
  "reserved",
  "sold",
  "unpublished",
];

/** ISO 4217-style currency: exactly 3 uppercase letters */
const CURRENCY_RE = /^[A-Z]{3}$/;

export type VehicleValidationIssue = {
  field: string;
  message: string;
};

export function isValidIsoDate(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  const t = Date.parse(value);
  return !Number.isNaN(t);
}

/**
 * Safe local public image path only.
 * Allows: "/vehicles/foo.jpg", "vehicles/foo.jpg"
 * Rejects: "..", absolute FS paths, http(s), javascript:, data:, etc.
 */
export function isSafePublicImagePath(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (!s) return false;
  if (s.includes("..")) return false;
  if (s.includes("\0")) return false;
  const lower = s.toLowerCase();
  if (
    lower.startsWith("http:") ||
    lower.startsWith("https:") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("blob:")
  ) {
    return false;
  }
  // No Windows drive letters or UNC
  if (/^[a-zA-Z]:[\\/]/.test(s) || s.startsWith("\\\\")) return false;
  // Must be a relative public path (leading slash optional)
  const normalized = s.startsWith("/") ? s.slice(1) : s;
  if (!normalized || pathLooksAbsolute(normalized)) return false;
  // Restrict to known public asset prefixes used by the app
  if (
    !normalized.startsWith("vehicles/") &&
    !normalized.startsWith("images/") &&
    normalized !== "logo.jpg"
  ) {
    return false;
  }
  // Simple filename safety
  if (!/^[a-zA-Z0-9/_.\-]+$/.test(normalized)) return false;
  return true;
}

function pathLooksAbsolute(p: string): boolean {
  return p.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(p);
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
  if (
    typeof v.year !== "number" ||
    !Number.isFinite(v.year) ||
    !Number.isInteger(v.year) ||
    v.year < 1980 ||
    v.year > 2100
  ) {
    issues.push({
      field: "year",
      message: "year must be an integer between 1980 and 2100",
    });
  }
  if (typeof v.price !== "number" || !Number.isFinite(v.price) || v.price < 0) {
    issues.push({
      field: "price",
      message: "price must be a finite non-negative number",
    });
  }
  if (typeof v.currency !== "string" || !CURRENCY_RE.test(v.currency)) {
    issues.push({
      field: "currency",
      message: "currency must be a 3-letter ISO code (e.g. USD, NGN)",
    });
  }
  if (
    typeof v.mileage !== "number" ||
    !Number.isFinite(v.mileage) ||
    v.mileage < 0
  ) {
    issues.push({
      field: "mileage",
      message: "mileage must be a finite non-negative number",
    });
  }
  if (typeof v.fuel !== "string" || !v.fuel.trim()) {
    issues.push({ field: "fuel", message: "fuel is required" });
  }
  if (typeof v.transmission !== "string" || !v.transmission.trim()) {
    issues.push({ field: "transmission", message: "transmission is required" });
  }
  if (typeof v.engine !== "string" || !v.engine.trim()) {
    issues.push({ field: "engine", message: "engine is required" });
  }
  if (typeof v.bodyType !== "string" || !v.bodyType.trim()) {
    issues.push({ field: "bodyType", message: "bodyType is required" });
  }
  if (typeof v.condition !== "string" || !v.condition.trim()) {
    issues.push({ field: "condition", message: "condition is required" });
  }
  if (typeof v.description !== "string" || !v.description.trim()) {
    issues.push({ field: "description", message: "description is required" });
  }
  if (typeof v.location !== "string" || !v.location.trim()) {
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
  if (!Array.isArray(v.features)) {
    issues.push({ field: "features", message: "features must be an array" });
  } else if (
    v.features.some((f) => typeof f !== "string" || !f.trim())
  ) {
    issues.push({
      field: "features",
      message: "features must contain only non-empty strings",
    });
  }
  if (!Array.isArray(v.images)) {
    issues.push({
      field: "images",
      message: "images must be an array of strings",
    });
  } else {
    for (const img of v.images) {
      if (!isSafePublicImagePath(img)) {
        issues.push({
          field: "images",
          message:
            "images must be safe local public paths (e.g. /vehicles/photo.jpg)",
        });
        break;
      }
    }
  }

  if (v.createdAt !== undefined && !isValidIsoDate(v.createdAt)) {
    issues.push({
      field: "createdAt",
      message: "createdAt must be a valid ISO date",
    });
  }
  if (v.updatedAt !== undefined && !isValidIsoDate(v.updatedAt)) {
    issues.push({
      field: "updatedAt",
      message: "updatedAt must be a valid ISO date",
    });
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
