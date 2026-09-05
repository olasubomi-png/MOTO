import Link from "next/link";
import Image from "next/image";
import { Vehicle, formatPrice, formatMileage, getVehicleImage } from "@/lib/vehicles";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const mainImage = getVehicleImage(vehicle.images[0]);
  const isAvailable = vehicle.availability === "available";
  const isReserved = vehicle.availability === "reserved";
  const isSold = vehicle.availability === "sold";

  return (
    <Link
      href={`/inventory/${vehicle.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_0_1px_rgba(201,162,39,0.15)]"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={mainImage}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Availability badge */}
        <div className="absolute top-3 left-3">
          {isAvailable && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
              Available
            </span>
          )}
          {isReserved && (
            <span className="inline-flex items-center rounded-full bg-amber-500/90 px-2.5 py-0.5 text-xs font-semibold text-black backdrop-blur-sm">
              Reserved
            </span>
          )}
          {isSold && (
            <span className="inline-flex items-center rounded-full bg-red-500/90 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
              Sold
            </span>
          )}
        </div>
        {vehicle.featured && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center rounded-full bg-gold/90 px-2.5 py-0.5 text-xs font-semibold text-black backdrop-blur-sm">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gold">
          {vehicle.year} · {vehicle.bodyType}
        </div>
        <h3 className="text-lg font-semibold leading-tight text-foreground group-hover:text-gold transition-colors">
          {vehicle.make} {vehicle.model}
        </h3>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{formatMileage(vehicle.mileage)}</span>
          <span>{vehicle.transmission}</span>
          <span>{vehicle.fuel}</span>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <p className="text-xl font-bold tracking-tight text-foreground">
            {formatPrice(vehicle.price, vehicle.currency)}
          </p>
          <span className="text-sm font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
