import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Vehicle } from "../vehicle-types.ts";
import { validateVehicle, dedupeVehiclesById } from "../vehicle-validation.ts";
import {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
} from "../vehicle-query.ts";

function sample(partial: Partial<Vehicle> & Pick<Vehicle, "id">): Vehicle {
  return {
    make: "BMW",
    model: "X7",
    year: 2024,
    price: 100000,
    currency: "USD",
    mileage: 5000,
    fuel: "Petrol",
    transmission: "Automatic",
    engine: "3.0L",
    bodyType: "SUV",
    exteriorColor: "Black",
    interiorColor: "Black",
    condition: "Excellent",
    description: "Test vehicle",
    features: ["A"],
    location: "Lagos",
    availability: "available",
    featured: false,
    images: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("validateVehicle", () => {
  it("accepts a complete vehicle", () => {
    assert.equal(validateVehicle(sample({ id: "1" })).length, 0);
  });

  it("rejects missing make", () => {
    const issues = validateVehicle(sample({ id: "1", make: "" }));
    assert.ok(issues.some((i) => i.field === "make"));
  });

  it("rejects invalid availability", () => {
    const issues = validateVehicle(
      sample({ id: "1", availability: "pending" as Vehicle["availability"] })
    );
    assert.ok(issues.some((i) => i.field === "availability"));
  });

  it("rejects negative price", () => {
    const issues = validateVehicle(sample({ id: "1", price: -1 }));
    assert.ok(issues.some((i) => i.field === "price"));
  });
});

describe("dedupeVehiclesById", () => {
  it("keeps first of duplicate ids", () => {
    const a = sample({ id: "1", make: "A" });
    const b = sample({ id: "1", make: "B" });
    const out = dedupeVehiclesById([a, b]);
    assert.equal(out.length, 1);
    assert.equal(out[0].make, "A");
  });
});

describe("filterAndSortVehicles", () => {
  const pool = [
    sample({
      id: "1",
      make: "BMW",
      model: "X7",
      price: 120000,
      availability: "available",
      createdAt: "2026-03-01T00:00:00.000Z",
    }),
    sample({
      id: "2",
      make: "Toyota",
      model: "Land Cruiser",
      price: 80000,
      bodyType: "SUV",
      availability: "available",
      createdAt: "2026-02-01T00:00:00.000Z",
    }),
    sample({
      id: "3",
      make: "Audi",
      model: "Q8",
      price: 90000,
      availability: "sold",
      createdAt: "2026-04-01T00:00:00.000Z",
    }),
    sample({
      id: "4",
      make: "Porsche",
      model: "Cayenne",
      price: 98000,
      availability: "reserved",
      createdAt: "2026-01-15T00:00:00.000Z",
    }),
  ];

  it("hides sold by default", () => {
    const results = filterAndSortVehicles(pool, {});
    assert.ok(results.every((v) => v.availability !== "sold"));
    assert.equal(results.length, 3);
  });

  it("filters by make", () => {
    const results = filterAndSortVehicles(pool, { make: "BMW" });
    assert.equal(results.length, 1);
    assert.equal(results[0].id, "1");
  });

  it("searches make and model", () => {
    const results = filterAndSortVehicles(pool, { q: "land" });
    assert.equal(results.length, 1);
    assert.equal(results[0].model, "Land Cruiser");
  });

  it("sorts by price ascending deterministically", () => {
    const results = filterAndSortVehicles(pool, { sort: "price-asc" });
    const prices = results.map((v) => v.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  });

  it("can filter sold when requested", () => {
    const results = filterAndSortVehicles(pool, { availability: "sold" });
    assert.equal(results.length, 1);
    assert.equal(results[0].id, "3");
  });
});

describe("pickRelatedVehicles", () => {
  it("excludes current and sold", () => {
    const current = sample({ id: "1", bodyType: "SUV", make: "BMW" });
    const pool = [
      current,
      sample({
        id: "2",
        bodyType: "SUV",
        make: "BMW",
        availability: "available",
      }),
      sample({ id: "3", bodyType: "SUV", availability: "sold" }),
      sample({ id: "4", bodyType: "Sedan", availability: "available" }),
    ];
    const related = pickRelatedVehicles(current, pool, 4);
    assert.ok(!related.some((v) => v.id === "1"));
    assert.ok(!related.some((v) => v.availability === "sold"));
    assert.ok(related.some((v) => v.id === "2"));
  });
});

describe("formatters", () => {
  it("formats price and mileage", () => {
    assert.match(formatPrice(1000, "USD"), /1,000|1000/);
    assert.match(formatMileage(12500), /12,500 km|12500 km/);
  });
});
