/**
 * Neon/PostgreSQL vehicle repository.
 * Server-only — never import from Client Components.
 */
import { and, asc, desc, eq, gte, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb, vehicles } from "../db/index.ts";
import type { Vehicle } from "./vehicle-types.ts";
import type { VehicleFilters } from "./vehicle-query.ts";
import {
  filterAndSortVehicles,
  pickRelatedVehicles,
} from "./vehicle-query.ts";
import { validateVehicle } from "./vehicle-validation.ts";
import { rowToVehicle, vehicleToRow } from "./vehicle-mapper.ts";

export type { Vehicle, VehicleFilters };

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

/**
 * Search with SQL-side filters where practical; final sort/filter via pure helpers
 * for deterministic parity with existing behaviour.
 */
export async function searchVehicles(
  filters: VehicleFilters
): Promise<Vehicle[]> {
  const db = getDb();
  const conditions: SQL[] = [];

  if (filters.availability) {
    conditions.push(
      eq(
        vehicles.availability,
        filters.availability as "available" | "reserved" | "sold" | "unpublished"
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
  // Text search + deterministic sort in pure layer.
  // Pass through availability only when explicitly requested; otherwise the
  // pure helper keeps available|reserved (SQL already narrowed the set).
  return filterAndSortVehicles(mapped, {
    q: filters.q,
    model: filters.model,
    sort: filters.sort,
    availability: filters.availability,
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

/* -------------------- Mutations (Admin / VPS) -------------------- */

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

export async function updateVehicle(
  id: string,
  data: Partial<Vehicle>
): Promise<Vehicle | null> {
  const db = getDb();
  const existing = await getVehicleById(id);
  if (!existing) return null;

  const next: Vehicle = {
    ...existing,
    ...data,
    id,
    price:
      data.price !== undefined ? Math.round(data.price) : existing.price,
    mileage:
      data.mileage !== undefined ? Math.round(data.mileage) : existing.mileage,
    updatedAt: new Date().toISOString(),
  };
  const issues = validateVehicle(next);
  if (issues.length > 0) {
    throw new Error(issues.map((i) => i.message).join("; "));
  }

  const row = vehicleToRow(next);
  await db
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
    .where(eq(vehicles.id, id));

  return getVehicleById(id);
}

export async function deleteVehicle(id: string): Promise<boolean> {
  const db = getDb();
  const existing = await getVehicleById(id);
  if (!existing) return false;
  await db.delete(vehicles).where(eq(vehicles.id, id));
  return true;
}

/**
 * Idempotent upsert by primary key — used by seed and admin import.
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

  await db
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
    });

  const saved = await getVehicleById(vehicle.id);
  if (!saved) throw new Error(`Upsert failed for vehicle ${vehicle.id}`);
  return saved;
}
