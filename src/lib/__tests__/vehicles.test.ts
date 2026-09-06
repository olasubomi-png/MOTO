import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Vehicle } from "../vehicle-types";
import {
  validateVehicle,
  dedupeVehiclesById,
  isSafePublicImagePath,
} from "../vehicle-validation";
import {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
} from "../vehicle-query";
import { getVehicleImage, PLACEHOLDER_IMAGE } from "../vehicle-images";

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
    description: "Test vehicle description",
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
    assert.ok(validateVehicle(sample({ id: "1", make: "" })).some((i) => i.field === "make"));
  });

  it("rejects invalid availability", () => {
    assert.ok(
      validateVehicle(
        sample({ id: "1", availability: "pending" as Vehicle["availability"] })
      ).some((i) => i.field === "availability")
    );
  });

  it("rejects negative price", () => {
    assert.ok(validateVehicle(sample({ id: "1", price: -1 })).some((i) => i.field === "price"));
  });

  it("rejects non-integer year", () => {
    assert.ok(validateVehicle(sample({ id: "1", year: 2024.5 })).some((i) => i.field === "year"));
  });

  it("rejects invalid currency", () => {
    assert.ok(validateVehicle(sample({ id: "1", currency: "usd" })).some((i) => i.field === "currency"));
  });

  it("rejects unsafe image paths", () => {
    assert.ok(
      validateVehicle(sample({ id: "1", images: ["http://evil.com/x.jpg"] })).some(
        (i) => i.field === "images"
      )
    );
  });
});

describe("isSafePublicImagePath", () => {
  it("allows vehicles namespace", () => {
    assert.equal(isSafePublicImagePath("/vehicles/a.jpg"), true);
  });
  it("allows https image URLs and blocks unsafe schemes", () => {
    assert.equal(isSafePublicImagePath("https://cdn.example/x.jpg"), true);
    assert.equal(isSafePublicImagePath("http://cdn.example/x.jpg"), false);
    assert.equal(isSafePublicImagePath("javascript:alert(1)"), false);
  });
});

describe("dedupeVehiclesById", () => {
  it("keeps first of duplicate ids", () => {
    const out = dedupeVehiclesById([
      sample({ id: "1", make: "A" }),
      sample({ id: "1", make: "B" }),
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].make, "A");
  });
});

describe("filterAndSortVehicles", () => {
  const pool = [
    sample({ id: "1", make: "BMW", price: 120000, availability: "available", createdAt: "2026-03-01T00:00:00.000Z" }),
    sample({ id: "2", make: "Toyota", model: "Land Cruiser", price: 80000, availability: "available", createdAt: "2026-02-01T00:00:00.000Z" }),
    sample({ id: "3", make: "Audi", price: 90000, availability: "sold", createdAt: "2026-04-01T00:00:00.000Z" }),
    sample({ id: "4", make: "Porsche", price: 98000, availability: "reserved", createdAt: "2026-01-15T00:00:00.000Z" }),
  ];

  it("hides sold by default", () => {
    assert.equal(filterAndSortVehicles(pool, {}).length, 3);
  });

  it("filters by make", () => {
    assert.equal(filterAndSortVehicles(pool, { make: "BMW" }).length, 1);
  });

  it("searches model", () => {
    assert.equal(filterAndSortVehicles(pool, { q: "land" })[0].model, "Land Cruiser");
  });

  it("sorts price ascending", () => {
    const prices = filterAndSortVehicles(pool, { sort: "price-asc" }).map((v) => v.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  });
});

describe("pickRelatedVehicles", () => {
  it("excludes current and sold", () => {
    const current = sample({ id: "1", bodyType: "SUV", make: "BMW" });
    const related = pickRelatedVehicles(current, [
      current,
      sample({ id: "2", bodyType: "SUV", make: "BMW", availability: "available" }),
      sample({ id: "3", bodyType: "SUV", availability: "sold" }),
    ], 4);
    assert.ok(!related.some((v) => v.id === "1"));
    assert.ok(!related.some((v) => v.availability === "sold"));
  });
});

describe("getVehicleImage", () => {
  it("returns placeholder for empty or unsafe", () => {
    assert.equal(getVehicleImage(""), PLACEHOLDER_IMAGE);
    assert.equal(getVehicleImage("http://x.com/a.jpg"), PLACEHOLDER_IMAGE);
    assert.equal(getVehicleImage("javascript:alert(1)"), PLACEHOLDER_IMAGE);
  });
  it("passes through safe https URLs", () => {
    assert.equal(getVehicleImage("https://cdn.example/a.jpg"), "https://cdn.example/a.jpg");
  });
  it("returns safe local path", () => {
    assert.equal(getVehicleImage("/vehicles/a.jpg"), "/vehicles/a.jpg");
  });
});

describe("formatters", () => {
  it("formats price and mileage", () => {
    assert.match(formatPrice(1000, "USD"), /1,000|1000/);
    assert.match(formatMileage(12500), /12,500 km|12500 km/);
  });
});

describe("vehicle-mapper pure shape", () => {
  it("rowToVehicle produces ISO date strings", async () => {
    const { rowToVehicle } = await import("../vehicle-mapper");
    const row = {
      id: "1",
      make: "BMW",
      model: "X7",
      year: 2024,
      price: 100000,
      currency: "USD",
      mileage: 1000,
      fuel: "Petrol",
      transmission: "Automatic",
      engine: "3.0L",
      bodyType: "SUV",
      exteriorColor: "Black",
      interiorColor: "Black",
      condition: "Excellent",
      description: "Test",
      features: ["A"],
      location: "Lagos",
      availability: "available" as const,
      featured: false,
      images: [] as string[],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    };
    const v = rowToVehicle(row);
    assert.equal(v.createdAt, "2026-01-01T00:00:00.000Z");
    assert.equal(v.updatedAt, "2026-01-02T00:00:00.000Z");
    assert.equal(v.price, 100000);
  });
});

describe("isDemoVehicle", () => {
  it("detects Demo condition and Demo Catalogue location", async () => {
    const { isDemoVehicle } = await import("../vehicle-types");
    assert.equal(
      isDemoVehicle({ condition: "Demo", location: "Lagos" }),
      true
    );
    assert.equal(
      isDemoVehicle({ condition: "Excellent", location: "Demo Catalogue" }),
      true
    );
    assert.equal(
      isDemoVehicle({ condition: "Excellent", location: "Lagos, Nigeria" }),
      false
    );
  });
});

describe("image safety rejects dangerous protocols", () => {
  it("rejects javascript and data URLs", () => {
    assert.equal(isSafePublicImagePath("javascript:alert(1)"), false);
    assert.equal(isSafePublicImagePath("data:text/html;base64,xx"), false);
    assert.equal(isSafePublicImagePath("file:///etc/passwd"), false);
    assert.equal(isSafePublicImagePath("blob:https://x"), false);
  });

  it("rejects https URLs with embedded credentials", () => {
    assert.equal(
      isSafePublicImagePath("https://user:pass@cdn.example/a.jpg"),
      false
    );
  });
});


describe("featured filter", () => {
  it("returns only featured vehicles when requested", () => {
    const source = [
      sample({ id: "a", featured: true }),
      sample({ id: "b", featured: false }),
    ];
    const out = filterAndSortVehicles(source, { featured: true });
    assert.equal(out.length, 1);
    assert.equal(out[0].id, "a");
  });
});
