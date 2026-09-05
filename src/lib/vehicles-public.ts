/**
 * Public read-only inventory layer for the Vercel/Next.js site.
 * Uses a static JSON import so Turbopack can trace only data/vehicles.json.
 * No fs, path, crypto, or mutation code — safe for any server component.
 */

import rawInventory from "../../data/vehicles.json";
import {
  validateVehicle,
  dedupeVehiclesById,
} from "./vehicle-validation.ts";
import {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
  type VehicleFilters,
} from "./vehicle-query.ts";
import type { Vehicle } from "./vehicle-types.ts";
import { getVehicleImage, PLACEHOLDER_IMAGE } from "./vehicle-images.ts";

export type { Vehicle, VehicleFilters };
export {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
  getVehicleImage,
  PLACEHOLDER_IMAGE,
};

function normalizeInventory(raw: unknown): Vehicle[] {
  if (!Array.isArray(raw)) return [];
  const valid: Vehicle[] = [];
  for (const item of raw) {
    if (validateVehicle(item).length > 0) continue;
    valid.push(item as Vehicle);
  }
  return dedupeVehiclesById(valid);
}

/** Snapshot from build-time / module-load static import */
const inventorySnapshot: Vehicle[] = normalizeInventory(rawInventory);

export function getAllVehicles(includeUnpublished = false): Vehicle[] {
  if (includeUnpublished) return [...inventorySnapshot];
  return inventorySnapshot.filter((v) => v.availability !== "unpublished");
}

export function getVehicleById(id: string): Vehicle | undefined {
  if (!id || typeof id !== "string") return undefined;
  return inventorySnapshot.find((v) => v.id === id);
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

/**
 * Sample catalogue when no real photos are attached.
 * Client/server safe — does not touch the filesystem.
 */
export function isSampleInventory(): boolean {
  const vehicles = getAllVehicles(true);
  if (vehicles.length === 0) return true;
  return vehicles.every((v) => !v.images?.length);
}
