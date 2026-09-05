/**
 * Compatibility re-export of the public read-only inventory API.
 * Prefer "@/lib/vehicles-public" or "@/lib/vehicle-images".
 * Filesystem mutations: "@/lib/vehicles-repo" (VPS/Admin only).
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
  filterAndSortVehicles,
  pickRelatedVehicles,
  formatPrice,
  formatMileage,
  getVehicleImage,
  PLACEHOLDER_IMAGE,
  type Vehicle,
  type VehicleFilters,
} from "./vehicles-public.ts";
