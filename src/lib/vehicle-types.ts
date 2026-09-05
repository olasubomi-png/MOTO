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
