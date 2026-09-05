import fs from "fs";
import path from "path";
import {
  validateVehicle,
  dedupeVehiclesById,
  isSafePublicImagePath,
  type VehicleValidationIssue,
} from "./vehicle-validation.ts";
import {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
  type VehicleFilters,
} from "./vehicle-query.ts";
import type { Vehicle, VehicleAvailability } from "./vehicle-types.ts";


export type { Vehicle, VehicleAvailability, VehicleFilters };
export {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
  isSafePublicImagePath,
};

const PLACEHOLDER_IMAGE = "/vehicles/placeholder.svg";

/** Overridable paths for isolated concurrency tests */
let dataPath = path.join(process.cwd(), "data", "vehicles.json");
let lockPath = path.join(process.cwd(), "data", "vehicles.lock");
let publicDir = path.join(process.cwd(), "public");

/** @internal Test-only path injection — do not use in application code */
export function __setInventoryPathsForTests(opts: {
  dataPath: string;
  lockPath: string;
  publicDir?: string;
}): void {
  dataPath = opts.dataPath;
  lockPath = opts.lockPath;
  if (opts.publicDir) publicDir = opts.publicDir;
}

/** @internal Restore default paths after tests */
export function __resetInventoryPathsForTests(): void {
  dataPath = path.join(process.cwd(), "data", "vehicles.json");
  lockPath = path.join(process.cwd(), "data", "vehicles.lock");
  publicDir = path.join(process.cwd(), "public");
}

export function publicAssetExists(publicPath: string): boolean {
  if (!isSafePublicImagePath(publicPath)) return false;
  const normalized = publicPath.startsWith("/")
    ? publicPath.slice(1)
    : publicPath;
  const full = path.join(publicDir, normalized);
  if (!full.startsWith(publicDir)) return false;
  try {
    return fs.existsSync(full) && fs.statSync(full).isFile();
  } catch {
    return false;
  }
}

export function getVehicleImage(src?: string | null): string {
  if (!src || typeof src !== "string" || !src.trim()) {
    return PLACEHOLDER_IMAGE;
  }
  const trimmed = src.trim();
  if (!isSafePublicImagePath(trimmed)) return PLACEHOLDER_IMAGE;
  if (publicAssetExists(trimmed)) return trimmed;
  return PLACEHOLDER_IMAGE;
}

function sleepMs(ms: number) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    /* spin — keeps lock acquisition synchronous and predictable under Node */
  }
}

function acquireLock(timeoutMs = 8000): boolean {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      try {
        fs.writeFileSync(fd, `${process.pid}\n${Date.now()}`);
      } finally {
        fs.closeSync(fd);
      }
      return true;
    } catch {
      // Stale lock recovery: if lock is older than 30s, remove and retry
      try {
        const st = fs.statSync(lockPath);
        if (Date.now() - st.mtimeMs > 30_000) {
          fs.unlinkSync(lockPath);
          continue;
        }
      } catch {
        /* ignore */
      }
      sleepMs(15);
    }
  }
  return false;
}

function releaseLock() {
  try {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  } catch {
    /* ignore */
  }
}

function readVehiclesRaw(): unknown {
  try {
    if (!fs.existsSync(dataPath)) return [];
    const raw = fs.readFileSync(dataPath, "utf-8");
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

/** Write without locking — caller must hold the lock */
function writeVehiclesUnlocked(vehicles: Vehicle[]): void {
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
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${dataPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(vehicles, null, 2), "utf-8");
    fs.renameSync(tmp, dataPath);
  } catch (err) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    throw err;
  }
}

/**
 * Run a mutation under exclusive lock:
 * acquire → read latest → mutate → validate+atomic write → release
 */
function withInventoryMutation<T>(
  mutator: (vehicles: Vehicle[]) => { vehicles: Vehicle[]; result: T }
): T {
  if (!acquireLock()) {
    throw new Error("Could not acquire inventory lock — try again");
  }
  try {
    const current = readVehicles();
    const { vehicles: next, result } = mutator(current);
    writeVehiclesUnlocked(next);
    return result;
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

function baseVehicleFields(
  data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">
): Omit<Vehicle, "id" | "createdAt" | "updatedAt"> {
  return data;
}

let idCounter = 0;
function nextVehicleId(): string {
  idCounter += 1;
  return `${Date.now()}-${process.pid}-${idCounter}`;
}

export function createVehicle(
  data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">
): Vehicle {
  return withInventoryMutation((vehicles) => {
    const now = new Date().toISOString();
    const newVehicle: Vehicle = {
      ...baseVehicleFields(data),
      id: nextVehicleId(),
      createdAt: now,
      updatedAt: now,
    };
    const issues = validateVehicle(newVehicle);
    if (issues.length > 0) {
      throw new Error(issues.map((i) => i.message).join("; "));
    }
    if (vehicles.some((v) => v.id === newVehicle.id)) {
      throw new Error("Duplicate vehicle id");
    }
    return {
      vehicles: [...vehicles, newVehicle],
      result: newVehicle,
    };
  });
}

export function updateVehicle(
  id: string,
  data: Partial<Vehicle>
): Vehicle | null {
  return withInventoryMutation((vehicles) => {
    const idx = vehicles.findIndex((v) => v.id === id);
    if (idx === -1) {
      return { vehicles, result: null };
    }
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
    const copy = [...vehicles];
    copy[idx] = next;
    return { vehicles: copy, result: next };
  });
}

export function deleteVehicle(id: string): boolean {
  return withInventoryMutation((vehicles) => {
    const filtered = vehicles.filter((v) => v.id !== id);
    if (filtered.length === vehicles.length) {
      return { vehicles, result: false };
    }
    return { vehicles: filtered, result: true };
  });
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

/** Whether the inventory lock file is currently held (tests / diagnostics) */
export function isInventoryLocked(): boolean {
  try {
    return fs.existsSync(lockPath);
  } catch {
    return false;
  }
}
