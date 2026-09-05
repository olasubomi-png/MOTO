/**
 * Server-only vehicle repository for Next.js Server Components / Route Handlers.
 * CLI seed scripts should import from "@/lib/vehicle-repository-core" instead.
 */
import "server-only";

export {
  getAllVehicles,
  getVehicleById,
  getFeaturedVehicles,
  getRecentVehicles,
  getAvailableMakes,
  getAvailableBodyTypes,
  searchVehicles,
  getRelatedVehicles,
  isSampleInventory,
  getStats,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  upsertVehicle,
  InventoryConflictError,
  type Vehicle,
  type VehicleFilters,
} from "./vehicle-repository-core";
