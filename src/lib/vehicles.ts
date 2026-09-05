/**
 * Inventory API surface for Server Components / Admin.
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
  InventoryConflictError,
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
