import type { Vehicle } from "./vehicle-types";


export type VehicleFilters = {
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
  featured?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "mileage";
};

export function filterAndSortVehicles(
  source: Vehicle[],
  filters: VehicleFilters
): Vehicle[] {
  let results = [...source];

  if (filters.q) {
    const q = filters.q.toLowerCase().trim();
    results = results.filter(
      (v) =>
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        `${v.make} ${v.model}`.toLowerCase().includes(q)
    );
  }
  if (filters.make) results = results.filter((v) => v.make === filters.make);
  if (filters.model) {
    const m = filters.model.toLowerCase();
    results = results.filter((v) => v.model.toLowerCase().includes(m));
  }
  if (filters.yearMin != null)
    results = results.filter((v) => v.year >= filters.yearMin!);
  if (filters.yearMax != null)
    results = results.filter((v) => v.year <= filters.yearMax!);
  if (filters.priceMin != null)
    results = results.filter((v) => v.price >= filters.priceMin!);
  if (filters.priceMax != null)
    results = results.filter((v) => v.price <= filters.priceMax!);
  if (filters.mileageMax != null)
    results = results.filter((v) => v.mileage <= filters.mileageMax!);
  if (filters.fuel) results = results.filter((v) => v.fuel === filters.fuel);
  if (filters.transmission)
    results = results.filter((v) => v.transmission === filters.transmission);
  if (filters.featured === true)
    results = results.filter((v) => v.featured === true);
  if (filters.bodyType)
    results = results.filter((v) => v.bodyType === filters.bodyType);
  if (filters.condition)
    results = results.filter((v) => v.condition === filters.condition);

  if (filters.availability) {
    results = results.filter((v) => v.availability === filters.availability);
  } else {
    results = results.filter(
      (v) => v.availability === "available" || v.availability === "reserved"
    );
  }

  switch (filters.sort) {
    case "price-asc":
      results.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
      break;
    case "price-desc":
      results.sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
      break;
    case "mileage":
      results.sort((a, b) => a.mileage - b.mileage || a.id.localeCompare(b.id));
      break;
    case "newest":
    default:
      results.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
          a.id.localeCompare(b.id)
      );
  }

  return results;
}

export function pickRelatedVehicles(
  vehicle: Vehicle,
  pool: Vehicle[],
  limit = 4
): Vehicle[] {
  const all = pool.filter(
    (v) =>
      v.id !== vehicle.id &&
      (v.availability === "available" || v.availability === "reserved")
  );

  const scored = all.map((v) => {
    let score = 0;
    if (v.bodyType === vehicle.bodyType) score += 3;
    if (v.make === vehicle.make) score += 2;
    const priceDiff =
      vehicle.price > 0
        ? Math.abs(v.price - vehicle.price) / vehicle.price
        : 1;
    if (priceDiff < 0.25) score += 2;
    else if (priceDiff < 0.5) score += 1;
    if (v.fuel === vehicle.fuel) score += 1;
    return { vehicle: v, score };
  });

  scored.sort(
    (a, b) => b.score - a.score || a.vehicle.id.localeCompare(b.vehicle.id)
  );
  const related = scored.slice(0, limit).map((s) => s.vehicle);

  if (related.length < limit) {
    const ids = new Set(related.map((v) => v.id).concat(vehicle.id));
    const extras = all
      .filter((v) => !ids.has(v.id))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit - related.length);
    related.push(...extras);
  }

  return related;
}

export function formatPrice(price: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString("en-US")}`;
  }
}

export function formatMileage(mileage: number) {
  return new Intl.NumberFormat("en-US").format(mileage) + " km";
}
