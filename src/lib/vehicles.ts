/**
 * Public inventory surface for Server Components.
 * Admin mutations are exported from the same repository.
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
  createVehicle,
  updateVehicle,
  deleteVehicle,
  upsertVehicle,
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
