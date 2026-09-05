export type VehicleAvailability =
  | "available"
  | "reserved"
  | "sold"
  | "unpublished";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  fuel: string;
  transmission: string;
  engine: string;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  condition: string;
  description: string;
  features: string[];
  location: string;
  availability: VehicleAvailability;
  featured: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

/** Demo catalogue vehicles are not confirmed Tosin Signature Motors stock. */
export function isDemoVehicle(vehicle: Pick<Vehicle, "condition" | "location">): boolean {
  return (
    vehicle.condition === "Demo" ||
    vehicle.location === "Demo Catalogue" ||
    vehicle.location.startsWith("Demo")
  );
}
