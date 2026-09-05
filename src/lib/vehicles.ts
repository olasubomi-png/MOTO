import fs from "fs";
import path from "path";

export type VehicleAvailability = "available" | "reserved" | "sold" | "unpublished";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  fuel: string;
  transmission: string;
  engine: string;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  condition: string;
  description: string;
  features: string[];
  location: string;
  availability: VehicleAvailability;
  featured: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

const DATA_PATH = path.join(process.cwd(), "data", "vehicles.json");

function readVehicles(): Vehicle[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw) as Vehicle[];
  } catch {
    return [];
  }
}

function writeVehicles(vehicles: Vehicle[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(vehicles, null, 2), "utf-8");
}

export function getAllVehicles(includeUnpublished = false): Vehicle[] {
  const vehicles = readVehicles();
  if (includeUnpublished) return vehicles;
  return vehicles.filter((v) => v.availability !== "unpublished");
}

export function getVehicleById(id: string): Vehicle | undefined {
  return readVehicles().find((v) => v.id === id);
}

export function getFeaturedVehicles(): Vehicle[] {
  return getAllVehicles().filter((v) => v.featured && v.availability === "available");
}

export function getRecentVehicles(limit = 6): Vehicle[] {
  return getAllVehicles()
    .filter((v) => v.availability === "available")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getAvailableMakes(): string[] {
  const makes = new Set(getAllVehicles().map((v) => v.make));
  return Array.from(makes).sort();
}

export function getAvailableBodyTypes(): string[] {
  const types = new Set(getAllVehicles().map((v) => v.bodyType));
  return Array.from(types).sort();
}

export function searchVehicles(filters: {
  q?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  condition?: string;
  availability?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "mileage";
}): Vehicle[] {
  let results = getAllVehicles();

  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(
      (v) =>
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        `${v.make} ${v.model}`.toLowerCase().includes(q)
    );
  }
  if (filters.make) results = results.filter((v) => v.make === filters.make);
  if (filters.model) results = results.filter((v) => v.model.toLowerCase().includes(filters.model!.toLowerCase()));
  if (filters.yearMin) results = results.filter((v) => v.year >= filters.yearMin!);
  if (filters.yearMax) results = results.filter((v) => v.year <= filters.yearMax!);
  if (filters.priceMin) results = results.filter((v) => v.price >= filters.priceMin!);
  if (filters.priceMax) results = results.filter((v) => v.price <= filters.priceMax!);
  if (filters.mileageMax) results = results.filter((v) => v.mileage <= filters.mileageMax!);
  if (filters.fuel) results = results.filter((v) => v.fuel === filters.fuel);
  if (filters.transmission) results = results.filter((v) => v.transmission === filters.transmission);
  if (filters.bodyType) results = results.filter((v) => v.bodyType === filters.bodyType);
  if (filters.condition) results = results.filter((v) => v.condition === filters.condition);
  if (filters.availability) results = results.filter((v) => v.availability === filters.availability);
  else results = results.filter((v) => v.availability === "available" || v.availability === "reserved");

  switch (filters.sort) {
    case "price-asc":
      results.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      results.sort((a, b) => b.price - a.price);
      break;
    case "mileage":
      results.sort((a, b) => a.mileage - b.mileage);
      break;
    case "newest":
    default:
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return results;
}

export function createVehicle(data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">): Vehicle {
  const vehicles = readVehicles();
  const newVehicle: Vehicle = {
    ...data,
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  vehicles.push(newVehicle);
  writeVehicles(vehicles);
  return newVehicle;
}

export function updateVehicle(id: string, data: Partial<Vehicle>): Vehicle | null {
  const vehicles = readVehicles();
  const idx = vehicles.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  vehicles[idx] = {
    ...vehicles[idx],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  writeVehicles(vehicles);
  return vehicles[idx];
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
    unpublished: vehicles.filter((v) => v.availability === "unpublished").length,
  };
}

export function formatPrice(price: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number) {
  return new Intl.NumberFormat("en-US").format(mileage) + " km";
}

export function getRelatedVehicles(vehicle: Vehicle, limit = 4): Vehicle[] {
  const all = getAllVehicles().filter(
    (v) =>
      v.id !== vehicle.id &&
      (v.availability === "available" || v.availability === "reserved")
  );

  // Score by similarity
  const scored = all.map((v) => {
    let score = 0;
    if (v.bodyType === vehicle.bodyType) score += 3;
    if (v.make === vehicle.make) score += 2;
    const priceDiff = Math.abs(v.price - vehicle.price) / vehicle.price;
    if (priceDiff < 0.25) score += 2;
    else if (priceDiff < 0.5) score += 1;
    if (v.fuel === vehicle.fuel) score += 1;
    return { vehicle: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const related = scored.slice(0, limit).map((s) => s.vehicle);

  // Fill remaining with newest if needed
  if (related.length < limit) {
    const ids = new Set(related.map((v) => v.id).concat(vehicle.id));
    const extras = all
      .filter((v) => !ids.has(v.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit - related.length);
    related.push(...extras);
  }

  return related;
}

/** Safe image URL – falls back to placeholder when missing */
export function getVehicleImage(src?: string | null): string {
  if (!src || src.trim() === "") return "/vehicles/placeholder.svg";
  return src;
}

