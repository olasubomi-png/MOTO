/**
 * Neon/PostgreSQL vehicle repository core (no server-only guard).
 * CLI scripts may import this module.
 * App Server Components should import from "@/lib/vehicle-repository" instead.
 */
import { and, desc, eq, gte, lte, ne, or, type SQL } from "drizzle-orm";
import { getDb, vehicles } from "../db/client";
import type { Vehicle } from "./vehicle-types";
import type { VehicleFilters } from "./vehicle-query";
import {
  filterAndSortVehicles,
  pickRelatedVehicles,
} from "./vehicle-query";
import { validateVehicle } from "./vehicle-validation";
import { rowToVehicle, vehicleToRow } from "./vehicle-mapper";

export type { Vehicle, VehicleFilters };

/** Thrown when an update loses an optimistic concurrency race */
export class InventoryConflictError extends Error {
  readonly code = "INVENTORY_CONFLICT" as const;
  constructor(message = "Vehicle was modified by another session. Reload and try again.") {
    super(message);
    this.name = "InventoryConflictError";
  }
}

function publicAvailabilityClause() {
  return or(
    eq(vehicles.availability, "available"),
    eq(vehicles.availability, "reserved")
  );
}

export async function getAllVehicles(
  includeUnpublished = false
): Promise<Vehicle[]> {
  const db = getDb();
  const rows = includeUnpublished
    ? await db.select().from(vehicles)
    : await db
        .select()
        .from(vehicles)
        .where(ne(vehicles.availability, "unpublished"));
  return rows.map(rowToVehicle);
}

export async function getVehicleById(id: string): Promise<Vehicle | undefined> {
  if (!id) return undefined;
  const db = getDb();
  const rows = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id))
    .limit(1);
  return rows[0] ? rowToVehicle(rows[0]) : undefined;
}

export async function getFeaturedVehicles(): Promise<Vehicle[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(vehicles)
    .where(
      and(eq(vehicles.featured, true), eq(vehicles.availability, "available"))
    );
  return rows.map(rowToVehicle);
}

export async function getRecentVehicles(limit = 6): Promise<Vehicle[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.availability, "available"))
    .orderBy(desc(vehicles.createdAt))
    .limit(limit);
  return rows.map(rowToVehicle);
}

export async function getAvailableMakes(): Promise<string[]> {
  const all = await getAllVehicles();
  return Array.from(new Set(all.map((v) => v.make))).sort();
}

export async function getAvailableBodyTypes(): Promise<string[]> {
  const all = await getAllVehicles();
  return Array.from(new Set(all.map((v) => v.bodyType))).sort();
}

export async function searchVehicles(
  filters: VehicleFilters
): Promise<Vehicle[]> {
  const db = getDb();
  const conditions: SQL[] = [];

  if (filters.availability) {
    conditions.push(
      eq(
        vehicles.availability,
        filters.availability as
          | "available"
          | "reserved"
          | "sold"
          | "unpublished"
      )
    );
  } else {
    const pub = publicAvailabilityClause();
    if (pub) conditions.push(pub);
  }

  if (filters.make) conditions.push(eq(vehicles.make, filters.make));
  if (filters.bodyType) conditions.push(eq(vehicles.bodyType, filters.bodyType));
  if (filters.fuel) conditions.push(eq(vehicles.fuel, filters.fuel));
  if (filters.transmission)
    conditions.push(eq(vehicles.transmission, filters.transmission));
  if (filters.yearMin != null)
    conditions.push(gte(vehicles.year, filters.yearMin));
  if (filters.yearMax != null)
    conditions.push(lte(vehicles.year, filters.yearMax));
  if (filters.priceMin != null)
    conditions.push(gte(vehicles.price, filters.priceMin));
  if (filters.priceMax != null)
    conditions.push(lte(vehicles.price, filters.priceMax));
  if (filters.mileageMax != null)
    conditions.push(lte(vehicles.mileage, filters.mileageMax));
  if (filters.featured === true)
    conditions.push(eq(vehicles.featured, true));

  const whereExpr =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

  const rows = whereExpr
    ? await db.select().from(vehicles).where(whereExpr)
    : await db.select().from(vehicles);

  const mapped = rows.map(rowToVehicle);
  return filterAndSortVehicles(mapped, {
    q: filters.q,
    model: filters.model,
    sort: filters.sort,
    availability: filters.availability,
    featured: filters.featured,
  });
}

export async function getRelatedVehicles(
  vehicle: Vehicle,
  limit = 4
): Promise<Vehicle[]> {
  const pool = await getAllVehicles();
  return pickRelatedVehicles(vehicle, pool, limit);
}

export async function isSampleInventory(): Promise<boolean> {
  const all = await getAllVehicles(true);
  if (all.length === 0) return true;
  return all.every((v) => !v.images?.length);
}

export async function getStats() {
  const all = await getAllVehicles(true);
  return {
    total: all.length,
    available: all.filter((v) => v.availability === "available").length,
    reserved: all.filter((v) => v.availability === "reserved").length,
    sold: all.filter((v) => v.availability === "sold").length,
    featured: all.filter((v) => v.featured).length,
    unpublished: all.filter((v) => v.availability === "unpublished").length,
  };
}

/* -------------------- Mutations (Admin) -------------------- */

export async function createVehicle(
  data: Omit<Vehicle, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<Vehicle> {
  const db = getDb();
  const id =
    data.id?.trim() ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  const vehicle: Vehicle = {
    ...data,
    id,
    price: Math.round(data.price),
    mileage: Math.round(data.mileage),
    createdAt: now,
    updatedAt: now,
  };
  const issues = validateVehicle(vehicle);
  if (issues.length > 0) {
    throw new Error(issues.map((i) => i.message).join("; "));
  }

  const row = vehicleToRow(vehicle);
  await db.insert(vehicles).values(row);
  const created = await getVehicleById(id);
  if (!created) throw new Error("Failed to create vehicle");
  return created;
}

/**
 * Update with optimistic concurrency on updatedAt.
 * If another admin changed the row since `existing` was loaded, throws InventoryConflictError.
 */
export async function updateVehicle(
  id: string,
  data: Partial<Vehicle>,
  opts?: { expectedUpdatedAt?: string }
): Promise<Vehicle | null> {
  const db = getDb();
  const existing = await getVehicleById(id);
  if (!existing) return null;

  const expected =
    opts?.expectedUpdatedAt ?? data.updatedAt ?? existing.updatedAt;

  const next: Vehicle = {
    ...existing,
    ...data,
    id,
    price: data.price !== undefined ? Math.round(data.price) : existing.price,
    mileage:
      data.mileage !== undefined ? Math.round(data.mileage) : existing.mileage,
    updatedAt: new Date().toISOString(),
  };
  const issues = validateVehicle(next);
  if (issues.length > 0) {
    throw new Error(issues.map((i) => i.message).join("; "));
  }

  const row = vehicleToRow(next);
  const expectedDate = new Date(expected);

  const result = await db
    .update(vehicles)
    .set({
      make: row.make,
      model: row.model,
      year: row.year,
      price: row.price,
      currency: row.currency,
      mileage: row.mileage,
      fuel: row.fuel,
      transmission: row.transmission,
      engine: row.engine,
      bodyType: row.bodyType,
      exteriorColor: row.exteriorColor,
      interiorColor: row.interiorColor,
      condition: row.condition,
      description: row.description,
      features: row.features,
      location: row.location,
      availability: row.availability,
      featured: row.featured,
      images: row.images,
      updatedAt: row.updatedAt,
    })
    .where(and(eq(vehicles.id, id), eq(vehicles.updatedAt, expectedDate)))
    .returning({ id: vehicles.id });

  if (!result.length) {
    // Distinguish missing vs conflict
    const stillThere = await getVehicleById(id);
    if (!stillThere) return null;
    throw new InventoryConflictError();
  }

  const updated = await getVehicleById(id);
  if (!updated) {
    throw new Error(`Vehicle ${id} disappeared after update`);
  }
  return updated;
}

export async function deleteVehicle(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db
    .delete(vehicles)
    .where(eq(vehicles.id, id))
    .returning({ id: vehicles.id });
  return result.length > 0;
}

/**
 * Idempotent upsert by primary key — seed and admin import.
 * Does not delete other vehicles.
 */
export async function upsertVehicle(vehicle: Vehicle): Promise<Vehicle> {
  const issues = validateVehicle(vehicle);
  if (issues.length > 0) {
    throw new Error(issues.map((i) => i.message).join("; "));
  }
  const db = getDb();
  const row = vehicleToRow({
    ...vehicle,
    price: Math.round(vehicle.price),
    mileage: Math.round(vehicle.mileage),
  });

  const inserted = await db
    .insert(vehicles)
    .values(row)
    .onConflictDoUpdate({
      target: vehicles.id,
      set: {
        make: row.make,
        model: row.model,
        year: row.year,
        price: row.price,
        currency: row.currency,
        mileage: row.mileage,
        fuel: row.fuel,
        transmission: row.transmission,
        engine: row.engine,
        bodyType: row.bodyType,
        exteriorColor: row.exteriorColor,
        interiorColor: row.interiorColor,
        condition: row.condition,
        description: row.description,
        features: row.features,
        location: row.location,
        availability: row.availability,
        featured: row.featured,
        images: row.images,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!inserted.length) {
    throw new Error(`Upsert failed for vehicle ${vehicle.id}`);
  }
  return rowToVehicle(inserted[0]);
}
