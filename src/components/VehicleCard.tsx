import Link from "next/link";
import Image from "next/image";
import type { Vehicle } from "@/lib/vehicle-types";
import { isDemoVehicle } from "@/lib/vehicle-types";
import { formatPrice, formatMileage } from "@/lib/vehicle-query";
import { getVehicleImage } from "@/lib/vehicle-images";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const primary = getVehicleImage(vehicle.images?.[0]);
  const isDemo = isDemoVehicle(vehicle);
  const isAvailable = vehicle.availability === "available";
  const isReserved = vehicle.availability === "reserved";
  const isSold = vehicle.availability === "sold";

  return (
    <Link
      href={`/inventory/${vehicle.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition duration-200 hover:border-gold/50 hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={primary}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          fill
          className={`object-cover transition duration-300 group-hover:scale-[1.03] ${
            isSold ? "opacity-70 grayscale-[30%]" : ""
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {isDemo && (
            <span className="inline-flex items-center rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur-sm">
              Demo Vehicle
            </span>
          )}
          {!isDemo && isAvailable && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
              Available
            </span>
          )}
          {!isDemo && isReserved && (
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

        {vehicle.featured && !isSold && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center rounded-full bg-gold/90 px-2.5 py-0.5 text-xs font-semibold text-black backdrop-blur-sm">
              Featured
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gold">
          {vehicle.year} · {vehicle.bodyType}
        </div>
        <h3 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-gold">
          {vehicle.make} {vehicle.model}
        </h3>

        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{formatMileage(vehicle.mileage)}</span>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <span>{vehicle.transmission}</span>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <span>{vehicle.fuel}</span>
        </div>

        {vehicle.location && (
          <p className="mt-2 truncate text-xs text-muted-foreground/80">
            {vehicle.location}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="text-xl font-bold tracking-tight text-foreground">
            {formatPrice(vehicle.price, vehicle.currency)}
          </p>
          <span className="shrink-0 text-sm font-medium text-gold">
            {isSold ? "View →" : "Details →"}
          </span>
        </div>
      </div>
    </Link>
  );
}
