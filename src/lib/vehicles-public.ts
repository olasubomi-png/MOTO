/**
 * Public inventory API for the Next.js site.
 * Backed by Neon PostgreSQL via the vehicle repository.
 * Async — call from Server Components / route handlers only.
 */
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
  type Vehicle,
  type VehicleFilters,
} from "./vehicle-repository.ts";

export {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
} from "./vehicle-query.ts";

export { getVehicleImage, PLACEHOLDER_IMAGE } from "./vehicle-images.ts";
