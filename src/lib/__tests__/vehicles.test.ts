import assert from "node:assert/strict";
import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Vehicle } from "../vehicle-types.ts";
import {
  validateVehicle,
  dedupeVehiclesById,
  isSafePublicImagePath,
} from "../vehicle-validation.ts";
import {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
} from "../vehicle-query.ts";
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAllVehicles,
  getVehicleById,
  isInventoryLocked,
  __setInventoryPathsForTests,
  __resetInventoryPathsForTests,
} from "../vehicles-repo.ts";

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

function payload(
  overrides: Partial<Omit<Vehicle, "id" | "createdAt" | "updatedAt">> = {}
): Omit<Vehicle, "id" | "createdAt" | "updatedAt"> {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = sample({
    id: "tmp",
    ...overrides,
  });
  return rest;
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

  it("rejects negative mileage", () => {
    assert.ok(
      validateVehicle(sample({ id: "1", mileage: -5 })).some((i) => i.field === "mileage")
    );
  });

  it("rejects non-integer year", () => {
    assert.ok(
      validateVehicle(sample({ id: "1", year: 2024.5 })).some((i) => i.field === "year")
    );
  });

  it("rejects invalid currency", () => {
    assert.ok(
      validateVehicle(sample({ id: "1", currency: "usd" })).some((i) => i.field === "currency")
    );
    assert.ok(
      validateVehicle(sample({ id: "1", currency: "US" })).some((i) => i.field === "currency")
    );
  });

  it("rejects invalid features", () => {
    assert.ok(
      validateVehicle(sample({ id: "1", features: ["ok", ""] as string[] })).some(
        (i) => i.field === "features"
      )
    );
  });

  it("rejects invalid dates", () => {
    assert.ok(
      validateVehicle(sample({ id: "1", createdAt: "not-a-date" })).some(
        (i) => i.field === "createdAt"
      )
    );
  });

  it("rejects unsafe image paths", () => {
    const cases = [
      "/etc/passwd",
      "../secret.jpg",
      "https://evil.com/x.jpg",
      "javascript:alert(1)",
      "C:\\Windows\\x.jpg",
    ];
    for (const img of cases) {
      assert.ok(
        validateVehicle(sample({ id: "1", images: [img] })).some((i) => i.field === "images"),
        `should reject ${img}`
      );
    }
  });

  it("accepts safe local vehicle image paths", () => {
    assert.equal(
      validateVehicle(
        sample({ id: "1", images: ["/vehicles/bmw-x7-1.jpg"] })
      ).length,
      0
    );
  });
});

describe("isSafePublicImagePath", () => {
  it("allows vehicles namespace", () => {
    assert.equal(isSafePublicImagePath("/vehicles/a.jpg"), true);
    assert.equal(isSafePublicImagePath("vehicles/a.jpg"), true);
  });

  it("blocks traversal and remote URLs", () => {
    assert.equal(isSafePublicImagePath("/vehicles/../../etc/passwd"), false);
    assert.equal(isSafePublicImagePath("https://cdn.example/x.jpg"), false);
    assert.equal(isSafePublicImagePath(""), false);
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
    assert.equal(filterAndSortVehicles(pool, { make: "BMW" }).length, 1);
  });

  it("searches make and model", () => {
    assert.equal(filterAndSortVehicles(pool, { q: "land" })[0].model, "Land Cruiser");
  });

  it("sorts by price ascending deterministically", () => {
    const prices = filterAndSortVehicles(pool, { sort: "price-asc" }).map((v) => v.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  });

  it("can filter sold when requested", () => {
    assert.equal(filterAndSortVehicles(pool, { availability: "sold" }).length, 1);
  });
});

describe("pickRelatedVehicles", () => {
  it("excludes current and sold", () => {
    const current = sample({ id: "1", bodyType: "SUV", make: "BMW" });
    const related = pickRelatedVehicles(
      current,
      [
        current,
        sample({ id: "2", bodyType: "SUV", make: "BMW", availability: "available" }),
        sample({ id: "3", bodyType: "SUV", availability: "sold" }),
        sample({ id: "4", bodyType: "Sedan", availability: "available" }),
      ],
      4
    );
    assert.ok(!related.some((v) => v.id === "1"));
    assert.ok(!related.some((v) => v.availability === "sold"));
  });
});

describe("formatters", () => {
  it("formats price and mileage", () => {
    assert.match(formatPrice(1000, "USD"), /1,000|1000/);
    assert.match(formatMileage(12500), /12,500 km|12500 km/);
  });
});

describe("inventory mutations (locked RMW)", () => {
  let tmpDir: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "motor-inv-"));
  });

  after(() => {
    __resetInventoryPathsForTests();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  beforeEach(() => {
    const dataFile = path.join(tmpDir, "vehicles.json");
    const lockFile = path.join(tmpDir, "vehicles.lock");
    fs.writeFileSync(dataFile, "[]", "utf-8");
    try {
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
    } catch {
      /* ignore */
    }
    __setInventoryPathsForTests({
      dataPath: dataFile,
      lockPath: lockFile,
      publicDir: path.join(process.cwd(), "public"),
    });
  });

  afterEach(() => {
    assert.equal(isInventoryLocked(), false, "lock must be released after each test");
  });

  it("creates a vehicle under lock", () => {
    const v = createVehicle(payload({ make: "Lexus", model: "LX 600" }));
    assert.ok(v.id);
    assert.equal(getVehicleById(v.id)?.make, "Lexus");
    assert.equal(getAllVehicles(true).length, 1);
  });

  it("rejects invalid vehicle and releases lock", () => {
    assert.throws(() => createVehicle(payload({ make: "" })));
    assert.equal(isInventoryLocked(), false);
    assert.equal(getAllVehicles(true).length, 0);
  });

  it("two concurrent creates both persist (no lost update)", async () => {
    const [a, b] = await Promise.all([
      Promise.resolve().then(() => createVehicle(payload({ make: "BMW", model: "X5" }))),
      Promise.resolve().then(() => createVehicle(payload({ make: "Audi", model: "Q7" }))),
    ]);
    assert.notEqual(a.id, b.id);
    const all = getAllVehicles(true);
    assert.equal(all.length, 2);
    const makes = new Set(all.map((v) => v.make));
    assert.ok(makes.has("BMW"));
    assert.ok(makes.has("Audi"));
  });

  it("concurrent updates to different vehicles both apply", async () => {
    const a = createVehicle(payload({ make: "BMW", model: "X5", price: 100 }));
    const b = createVehicle(payload({ make: "Audi", model: "Q7", price: 200 }));
    await Promise.all([
      Promise.resolve().then(() => updateVehicle(a.id, { price: 111 })),
      Promise.resolve().then(() => updateVehicle(b.id, { price: 222 })),
    ]);
    assert.equal(getVehicleById(a.id)?.price, 111);
    assert.equal(getVehicleById(b.id)?.price, 222);
  });

  it("concurrent update and delete do not corrupt store", async () => {
    const a = createVehicle(payload({ make: "BMW", model: "X5" }));
    const b = createVehicle(payload({ make: "Audi", model: "Q7" }));
    await Promise.all([
      Promise.resolve().then(() => updateVehicle(a.id, { price: 999 })),
      Promise.resolve().then(() => deleteVehicle(b.id)),
    ]);
    assert.equal(getVehicleById(a.id)?.price, 999);
    assert.equal(getVehicleById(b.id), undefined);
    assert.equal(getAllVehicles(true).length, 1);
    const raw = fs.readFileSync(path.join(tmpDir, "vehicles.json"), "utf-8");
    const parsed = JSON.parse(raw);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed.length, 1);
  });

  it("failed mutation after lock still releases lock", () => {
    createVehicle(payload({ make: "BMW", model: "X5" }));
    assert.throws(() =>
      updateVehicle(getAllVehicles(true)[0].id, {
        currency: "bad",
      } as Partial<Vehicle>)
    );
    assert.equal(isInventoryLocked(), false);
    assert.equal(getAllVehicles(true).length, 1);
  });

  it("does not write malformed inventory root", () => {
    createVehicle(payload({ make: "BMW", model: "X5" }));
    assert.throws(() => createVehicle(payload({ year: 12.5 })));
    const raw = JSON.parse(
      fs.readFileSync(path.join(tmpDir, "vehicles.json"), "utf-8")
    );
    assert.ok(Array.isArray(raw));
    assert.equal(raw.length, 1);
  });
});

describe("lock ownership safety", () => {
  let tmpDir: string;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "motor-lock-"));
  });

  after(() => {
    __resetInventoryPathsForTests();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  beforeEach(() => {
    const dataFile = path.join(tmpDir, "vehicles.json");
    const lockFile = path.join(tmpDir, "vehicles.lock");
    fs.writeFileSync(dataFile, "[]", "utf-8");
    try {
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
    } catch {
      /* ignore */
    }
    __setInventoryPathsForTests({ dataPath: dataFile, lockPath: lockFile });
  });

  it("releaseLock only removes own token", async () => {
    const { __lockTestApi } = await import("../vehicles-repo.ts");
    const a = __lockTestApi.acquireLock(5000);
    assert.ok(a);
    const tokenA = a!.token;
    // Simulate another process replacing the lock
    const tokenB = "other-process-token";
    fs.writeFileSync(__lockTestApi.getLockPath(), tokenB, "utf-8");
    __lockTestApi.releaseLock(a!);
    // B's lock must still be present
    assert.equal(__lockTestApi.readLockToken(), tokenB);
    // Cleanup as B
    __lockTestApi.releaseLock({ token: tokenB });
    assert.equal(__lockTestApi.readLockToken(), null);
    void tokenA;
  });

  it("stale recovery does not delete a fresh lock with different token", async () => {
    const { __lockTestApi } = await import("../vehicles-repo.ts");
    const staleToken = "stale-owner-token";
    __lockTestApi.plantLock(staleToken, __lockTestApi.STALE_LOCK_MS + 5_000);
    // New owner acquires after recovery
    const fresh = __lockTestApi.acquireLock(5000);
    assert.ok(fresh);
    assert.notEqual(fresh!.token, staleToken);
    assert.equal(__lockTestApi.readLockToken(), fresh!.token);
    // Old owner tries to release — must not remove fresh lock
    __lockTestApi.releaseLock({ token: staleToken });
    assert.equal(__lockTestApi.readLockToken(), fresh!.token);
    __lockTestApi.releaseLock(fresh!);
    assert.equal(__lockTestApi.readLockToken(), null);
  });

  it("failed operation releases only its own lock", async () => {
    const { __lockTestApi } = await import("../vehicles-repo.ts");
    assert.throws(() => createVehicle(payload({ make: "" })));
    assert.equal(isInventoryLocked(), false);
    assert.equal(__lockTestApi.readLockToken(), null);
  });
});

describe("cross-process concurrent creates", () => {
  it("two child processes both persist vehicles", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "motor-xproc-"));
    const dataFile = path.join(tmpDir, "vehicles.json");
    const lockFile = path.join(tmpDir, "vehicles.lock");
    fs.writeFileSync(dataFile, "[]", "utf-8");

    const workerSrc = `
import { createVehicle, __setInventoryPathsForTests } from ${JSON.stringify(
      path.join(process.cwd(), "src/lib/vehicles-repo.ts")
    )};
__setInventoryPathsForTests({
  dataPath: process.env.MOTOR_INVENTORY_DATA_PATH,
  lockPath: process.env.MOTOR_INVENTORY_LOCK_PATH,
});
const label = process.env.WORKER_LABEL || "W";
const v = createVehicle({
  make: label,
  model: "CrossProc",
  year: 2024,
  price: 50000,
  currency: "USD",
  mileage: 1000,
  fuel: "Petrol",
  transmission: "Automatic",
  engine: "2.0L",
  bodyType: "SUV",
  exteriorColor: "Black",
  interiorColor: "Black",
  condition: "Excellent",
  description: "Cross process test vehicle",
  features: ["Test"],
  location: "Lagos",
  availability: "available",
  featured: false,
  images: [],
});
process.stdout.write(JSON.stringify({ id: v.id, make: v.make }));
`;

    const workerFile = path.join(tmpDir, "worker.mts");
    fs.writeFileSync(workerFile, workerSrc);

    const { spawn } = await import("node:child_process");

    function runWorker(label: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const child = spawn(
          process.execPath,
          ["--experimental-strip-types", workerFile],
          {
            env: {
              ...process.env,
              MOTOR_INVENTORY_DATA_PATH: dataFile,
              MOTOR_INVENTORY_LOCK_PATH: lockFile,
              WORKER_LABEL: label,
            },
            cwd: process.cwd(),
          }
        );
        let out = "";
        let err = "";
        child.stdout.on("data", (d) => (out += d));
        child.stderr.on("data", (d) => (err += d));
        child.on("close", (code) => {
          if (code !== 0) reject(new Error(`worker ${label} exit ${code}: ${err}`));
          else resolve(out);
        });
      });
    }

    try {
      const [outA, outB] = await Promise.all([runWorker("ProcA"), runWorker("ProcB")]);
      const a = JSON.parse(outA);
      const b = JSON.parse(outB);
      assert.notEqual(a.id, b.id);
      const raw = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
      assert.ok(Array.isArray(raw));
      assert.equal(raw.length, 2);
      const makes = new Set(raw.map((v: { make: string }) => v.make));
      assert.ok(makes.has("ProcA"));
      assert.ok(makes.has("ProcB"));
      // JSON still valid, lock released
      assert.equal(fs.existsSync(lockFile), false);
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });
});
