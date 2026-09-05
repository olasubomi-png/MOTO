import fs from "fs";
import path from "path";
import {
  validateVehicle,
  dedupeVehiclesById,
  type VehicleValidationIssue,
} from "./vehicle-validation";
import {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
  type VehicleFilters,
} from "./vehicle-query";
import type { Vehicle, VehicleAvailability } from "./vehicle-types";

export type { Vehicle, VehicleAvailability, VehicleFilters };
export {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
};

const DATA_PATH = path.join(process.cwd(), "data", "vehicles.json");
const LOCK_PATH = path.join(process.cwd(), "data", "vehicles.lock");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const PLACEHOLDER_IMAGE = "/vehicles/placeholder.svg";

/** Whether a public path maps to an existing file under /public */
export function publicAssetExists(publicPath: string): boolean {
  if (!publicPath || typeof publicPath !== "string") return false;
  const normalized = publicPath.startsWith("/")
    ? publicPath.slice(1)
    : publicPath;
  if (normalized.includes("..") || path.isAbsolute(normalized)) return false;
  const full = path.join(PUBLIC_DIR, normalized);
  if (!full.startsWith(PUBLIC_DIR)) return false;
  try {
    return fs.existsSync(full) && fs.statSync(full).isFile();
  } catch {
    return false;
  }
}

/**
 * Safe image URL for UI. Missing or invalid paths → branded placeholder.
 */
export function getVehicleImage(src?: string | null): string {
  if (!src || typeof src !== "string" || !src.trim()) {
    return PLACEHOLDER_IMAGE;
  }
  const trimmed = src.trim();
  if (trimmed.includes("..")) return PLACEHOLDER_IMAGE;
  if (publicAssetExists(trimmed)) return trimmed;
  return PLACEHOLDER_IMAGE;
}

function acquireLock(timeoutMs = 3000): boolean {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const fd = fs.openSync(LOCK_PATH, "wx");
      fs.writeFileSync(fd, String(process.pid));
      fs.closeSync(fd);
      return true;
    } catch {
      const waitUntil = Date.now() + 25;
      while (Date.now() < waitUntil) {
        /* spin */
      }
    }
  }
  return false;
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH);
  } catch {
    /* ignore */
  }
}

function readVehiclesRaw(): unknown {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function normalizeInventory(raw: unknown): Vehicle[] {
  if (!Array.isArray(raw)) return [];
  const valid: Vehicle[] = [];
  for (const item of raw) {
    const issues = validateVehicle(item);
    if (issues.length > 0) continue;
    valid.push(item as Vehicle);
  }
  return dedupeVehiclesById(valid);
}

function readVehicles(): Vehicle[] {
  return normalizeInventory(readVehiclesRaw());
}

function writeVehicles(vehicles: Vehicle[]): void {
  const locked = acquireLock();
  if (!locked) {
    throw new Error("Could not acquire inventory lock — try again");
  }
  try {
    for (const v of vehicles) {
      const issues = validateVehicle(v);
      if (issues.length > 0) {
        throw new Error(
          `Refusing to write invalid vehicle ${v.id}: ${issues
            .map((i: VehicleValidationIssue) => i.message)
            .join(", ")}`
        );
      }
    }
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = `${DATA_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(vehicles, null, 2), "utf-8");
    fs.renameSync(tmp, DATA_PATH);
  } finally {
    releaseLock();
  }
}

export function getAllVehicles(includeUnpublished = false): Vehicle[] {
  const vehicles = readVehicles();
  if (includeUnpublished) return vehicles;
  return vehicles.filter((v) => v.availability !== "unpublished");
}

export function getVehicleById(id: string): Vehicle | undefined {
  if (!id || typeof id !== "string") return undefined;
  return readVehicles().find((v) => v.id === id);
}

export function getFeaturedVehicles(): Vehicle[] {
  return getAllVehicles().filter(
    (v) => v.featured && v.availability === "available"
  );
}

export function getRecentVehicles(limit = 6): Vehicle[] {
  return getAllVehicles()
    .filter((v) => v.availability === "available")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
}

export function getAvailableMakes(): string[] {
  return Array.from(new Set(getAllVehicles().map((v) => v.make))).sort();
}

export function getAvailableBodyTypes(): string[] {
  return Array.from(new Set(getAllVehicles().map((v) => v.bodyType))).sort();
}

export function searchVehicles(filters: VehicleFilters): Vehicle[] {
  return filterAndSortVehicles(getAllVehicles(), filters);
}

export function getRelatedVehicles(vehicle: Vehicle, limit = 4): Vehicle[] {
  return pickRelatedVehicles(vehicle, getAllVehicles(), limit);
}

export function createVehicle(
  data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">
): Vehicle {
  const vehicles = readVehicles();
  const now = new Date().toISOString();
  const newVehicle: Vehicle = {
    ...data,
    id: String(Date.now()),
    createdAt: now,
    updatedAt: now,
  };
  const issues = validateVehicle(newVehicle);
  if (issues.length > 0) {
    throw new Error(issues.map((i) => i.message).join("; "));
  }
  vehicles.push(newVehicle);
  writeVehicles(vehicles);
  return newVehicle;
}

export function updateVehicle(
  id: string,
  data: Partial<Vehicle>
): Vehicle | null {
  const vehicles = readVehicles();
  const idx = vehicles.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  const next: Vehicle = {
    ...vehicles[idx],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  const issues = validateVehicle(next);
  if (issues.length > 0) {
    throw new Error(issues.map((i) => i.message).join("; "));
  }
  vehicles[idx] = next;
  writeVehicles(vehicles);
  return next;
}

export function deleteVehicle(id: string): boolean {
  const vehicles = readVehicles();
  const filtered = vehicles.filter((v) => v.id !== id);
  if (filtered.length === vehicles.length) return false;
  writeVehicles(filtered);
  return true;
}

export function getStats() {
  const vehicles = readVehicles();
  return {
    total: vehicles.length,
    available: vehicles.filter((v) => v.availability === "available").length,
    reserved: vehicles.filter((v) => v.availability === "reserved").length,
    sold: vehicles.filter((v) => v.availability === "sold").length,
    featured: vehicles.filter((v) => v.featured).length,
    unpublished: vehicles.filter((v) => v.availability === "unpublished")
      .length,
  };
}

export function isSampleInventory(): boolean {
  const vehicles = readVehicles();
  if (vehicles.length === 0) return true;
  return vehicles.every(
    (v) =>
      !v.images.length || v.images.every((img) => !publicAssetExists(img))
  );
}
