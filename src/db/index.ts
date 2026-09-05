/**
 * Server-only database entry for Next.js Server Components / Route Handlers.
 */
import "server-only";

export {
  getDb,
  __resetDbForTests,
  type AppDatabase,
  vehicles,
  vehicleAvailabilityEnum,
  type VehicleRow,
  type NewVehicleRow,
} from "./client";
