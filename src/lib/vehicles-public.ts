/**
 * Public inventory API for Server Components.
 * Re-exports the Neon-backed repository (server-only).
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
} from "./vehicle-repository";

export {
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
} from "./vehicle-query";

export { getVehicleImage, PLACEHOLDER_IMAGE } from "./vehicle-images";
