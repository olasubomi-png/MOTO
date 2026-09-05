import type { Vehicle, VehicleAvailability } from "./vehicle-types.ts";
import type { VehicleRow, NewVehicleRow } from "../db/schema.ts";

/** Map a DB row to the shared Vehicle domain type (ISO date strings). */
export function rowToVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
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
    features: Array.isArray(row.features) ? row.features : [],
    location: row.location,
    availability: row.availability as VehicleAvailability,
    featured: row.featured,
    images: Array.isArray(row.images) ? row.images : [],
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt),
  };
}

/** Map domain Vehicle (or partial create payload) to a DB insert row. */
export function vehicleToRow(
  vehicle: Vehicle | (Omit<Vehicle, "id" | "createdAt" | "updatedAt"> & { id: string })
): NewVehicleRow {
  const now = new Date();
  const createdAt =
    "createdAt" in vehicle && vehicle.createdAt
      ? new Date(vehicle.createdAt)
      : now;
  const updatedAt =
    "updatedAt" in vehicle && vehicle.updatedAt
      ? new Date(vehicle.updatedAt)
      : now;

  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    price: Math.round(vehicle.price),
    currency: vehicle.currency,
    mileage: Math.round(vehicle.mileage),
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    engine: vehicle.engine,
    bodyType: vehicle.bodyType,
    exteriorColor: vehicle.exteriorColor,
    interiorColor: vehicle.interiorColor,
    condition: vehicle.condition,
    description: vehicle.description,
    features: vehicle.features ?? [],
    location: vehicle.location,
    availability: vehicle.availability,
    featured: vehicle.featured,
    images: vehicle.images ?? [],
    createdAt,
    updatedAt,
  };
}
