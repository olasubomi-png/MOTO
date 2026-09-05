import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const vehicleAvailabilityEnum = pgEnum("vehicle_availability", [
  "available",
  "reserved",
  "sold",
  "unpublished",
]);

/**
 * Vehicles table — single source of truth for inventory.
 * price is stored as an integer in major currency units (no floating point).
 * e.g. 145000 + currency USD means $145,000.
 */
export const vehicles = pgTable(
  "vehicles",
  {
    id: text("id").primaryKey(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    year: integer("year").notNull(),
    /** Major currency units as integer (never float) */
    price: integer("price").notNull(),
    currency: text("currency").notNull().default("USD"),
    mileage: integer("mileage").notNull().default(0),
    fuel: text("fuel").notNull(),
    transmission: text("transmission").notNull(),
    engine: text("engine").notNull().default(""),
    bodyType: text("body_type").notNull(),
    exteriorColor: text("exterior_color").notNull().default(""),
    interiorColor: text("interior_color").notNull().default(""),
    condition: text("condition").notNull().default(""),
    description: text("description").notNull().default(""),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    location: text("location").notNull().default(""),
    availability: vehicleAvailabilityEnum("availability")
      .notNull()
      .default("available"),
    featured: boolean("featured").notNull().default(false),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("vehicles_availability_idx").on(table.availability),
    index("vehicles_featured_idx").on(table.featured),
    index("vehicles_make_idx").on(table.make),
    index("vehicles_model_idx").on(table.model),
    index("vehicles_year_idx").on(table.year),
    index("vehicles_price_idx").on(table.price),
    index("vehicles_body_type_idx").on(table.bodyType),
  ]
);

export type VehicleRow = typeof vehicles.$inferSelect;
export type NewVehicleRow = typeof vehicles.$inferInsert;
