/**
 * VPS / server-only inventory repository.
 * Filesystem reads/writes with ownership-safe locking for Admin mutations.
 * Do not import this module from Client Components or the public read path.
 */
// Server/VPS only — never import from Client Components.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  validateVehicle,
  dedupeVehiclesById,
  isSafePublicImagePath,
  type VehicleValidationIssue,
} from "./vehicle-validation.ts";
import type { Vehicle } from "./vehicle-types.ts";

export type { Vehicle };

/** How long a lock may sit untouched before another process may attempt recovery */
const STALE_LOCK_MS = 120_000;

export type InventoryLockHandle = {
  token: string;
};

let dataPath =
  process.env.MOTOR_INVENTORY_DATA_PATH ||
  path.join(process.cwd(), "data", "vehicles.json");
let lockPath =
  process.env.MOTOR_INVENTORY_LOCK_PATH ||
  path.join(process.cwd(), "data", "vehicles.lock");
let publicDir =
  process.env.MOTOR_INVENTORY_PUBLIC_DIR ||
  path.join(process.cwd(), "public");

/** @internal Test-only path injection */
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
  dataPath =
    process.env.MOTOR_INVENTORY_DATA_PATH ||
    path.join(process.cwd(), "data", "vehicles.json");
  lockPath =
    process.env.MOTOR_INVENTORY_LOCK_PATH ||
    path.join(process.cwd(), "data", "vehicles.lock");
  publicDir =
    process.env.MOTOR_INVENTORY_PUBLIC_DIR ||
    path.join(process.cwd(), "public");
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

function sleepMs(ms: number) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    /* spin */
  }
}

function newLockToken(): string {
  return `${process.pid}-${Date.now()}-${crypto.randomBytes(16).toString("hex")}`;
}

function tryRecoverStaleLock(): void {
  let observed: string;
  let mtimeMs: number;
  try {
    observed = fs.readFileSync(lockPath, "utf-8");
    mtimeMs = fs.statSync(lockPath).mtimeMs;
  } catch {
    return;
  }
  if (Date.now() - mtimeMs < STALE_LOCK_MS) return;

  let observed2: string;
  try {
    observed2 = fs.readFileSync(lockPath, "utf-8");
  } catch {
    return;
  }
  if (observed2 !== observed) return;

  const tokenHash = crypto
    .createHash("sha256")
    .update(observed)
    .digest("hex")
    .slice(0, 16);
  const deadPath = `${lockPath}.stale.${tokenHash}`;

  try {
    fs.renameSync(lockPath, deadPath);
  } catch {
    return;
  }

  try {
    const deadContent = fs.readFileSync(deadPath, "utf-8");
    if (deadContent === observed) {
      fs.unlinkSync(deadPath);
    } else {
      try {
        fs.renameSync(deadPath, lockPath);
      } catch {
        /* leave deadPath */
      }
    }
  } catch {
    try {
      if (fs.existsSync(deadPath)) fs.unlinkSync(deadPath);
    } catch {
      /* ignore */
    }
  }
}

function acquireLock(timeoutMs = 15_000): InventoryLockHandle | null {
  const start = Date.now();
  const token = newLockToken();

  while (Date.now() - start < timeoutMs) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      try {
        fs.writeFileSync(fd, token, "utf-8");
      } finally {
        fs.closeSync(fd);
      }
      return { token };
    } catch {
      tryRecoverStaleLock();
      sleepMs(20);
    }
  }
  return null;
}

function releaseLock(handle: InventoryLockHandle): void {
  if (!handle?.token) return;
  try {
    if (!fs.existsSync(lockPath)) return;
    const current = fs.readFileSync(lockPath, "utf-8");
    if (current === handle.token) {
      fs.unlinkSync(lockPath);
    }
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
    if (validateVehicle(item).length > 0) continue;
    valid.push(item as Vehicle);
  }
  return dedupeVehiclesById(valid);
}

function readVehicles(): Vehicle[] {
  return normalizeInventory(readVehiclesRaw());
}

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

function withInventoryMutation<T>(
  mutator: (vehicles: Vehicle[]) => { vehicles: Vehicle[]; result: T }
): T {
  const handle = acquireLock();
  if (!handle) {
    throw new Error("Could not acquire inventory lock — try again");
  }
  try {
    const current = readVehicles();
    const { vehicles: next, result } = mutator(current);
    writeVehiclesUnlocked(next);
    return result;
  } finally {
    releaseLock(handle);
  }
}

/** Disk-backed read for admin/VPS (always fresh from filesystem) */
export function getAllVehiclesFromDisk(includeUnpublished = false): Vehicle[] {
  const vehicles = readVehicles();
  if (includeUnpublished) return vehicles;
  return vehicles.filter((v) => v.availability !== "unpublished");
}

export function getVehicleByIdFromDisk(id: string): Vehicle | undefined {
  if (!id || typeof id !== "string") return undefined;
  return readVehicles().find((v) => v.id === id);
}

/** Aliases used by mutation tests and admin code */
export const getAllVehicles = getAllVehiclesFromDisk;
export const getVehicleById = getVehicleByIdFromDisk;


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
      ...data,
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

export function isInventoryLocked(): boolean {
  try {
    return fs.existsSync(lockPath);
  } catch {
    return false;
  }
}

export const __lockTestApi = {
  acquireLock: (timeoutMs?: number) => acquireLock(timeoutMs),
  releaseLock: (handle: InventoryLockHandle) => releaseLock(handle),
  tryRecoverStaleLock: () => tryRecoverStaleLock(),
  STALE_LOCK_MS,
  getLockPath: () => lockPath,
  readLockToken: (): string | null => {
    try {
      if (!fs.existsSync(lockPath)) return null;
      return fs.readFileSync(lockPath, "utf-8");
    } catch {
      return null;
    }
  },
  plantLock: (token: string, ageMs = 0) => {
    fs.writeFileSync(lockPath, token, "utf-8");
    if (ageMs > 0) {
      const past = new Date(Date.now() - ageMs);
      fs.utimesSync(lockPath, past, past);
    }
  },
};
