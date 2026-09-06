import { Suspense } from "react";
import Link from "next/link";
import {
  searchVehicles,
  getAvailableMakes,
  getAvailableBodyTypes,
  isSampleInventory,
} from "@/lib/vehicles-public";
import { VehicleCard } from "@/components/VehicleCard";
import { InventoryFilters } from "@/components/InventoryFilters";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  make?: string;
  bodyType?: string;
  fuel?: string;
  transmission?: string;
  sort?: string;
  priceMin?: string;
  priceMax?: string;
  yearMin?: string;
  yearMax?: string;
  featured?: string;
}

export const metadata = {
  title: "Inventory",
  description: `Browse our current selection of premium vehicles at ${siteConfig.businessName}. ${siteConfig.tagline}`,
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const vehicles = await searchVehicles({
    q: params.q,
    make: params.make,
    bodyType: params.bodyType,
    fuel: params.fuel,
    transmission: params.transmission,
    sort:
      (params.sort as "newest" | "price-asc" | "price-desc" | "mileage") ||
      "newest",
    priceMin: params.priceMin ? Number(params.priceMin) : undefined,
    priceMax: params.priceMax ? Number(params.priceMax) : undefined,
    yearMin: params.yearMin ? Number(params.yearMin) : undefined,
    yearMax: params.yearMax ? Number(params.yearMax) : undefined,
    featured: params.featured === "true" ? true : undefined,
  });

  const makes = await getAvailableMakes();
  const bodyTypes = await getAvailableBodyTypes();
  const sample = await isSampleInventory();

  const filterState = {
    q: params.q,
    make: params.make,
    bodyType: params.bodyType,
    fuel: params.fuel,
    transmission: params.transmission,
    sort: params.sort,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
    yearMin: params.yearMin,
    yearMax: params.yearMax,
    featured: params.featured,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold">
          Our Collection
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Vehicle Inventory
        </h1>
        <p className="mt-2 text-muted-foreground">
          {vehicles.length === 0
            ? "No vehicles match your current filters"
            : `${vehicles.length} vehicle${vehicles.length !== 1 ? "s" : ""} matching your search`}
        </p>
        {sample && (
          <p className="mt-3 max-w-2xl rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground/90">
            Catalogue photos are being prepared. Listings below use sample
            specifications for demonstration — prices are shown in the currency
            recorded for each vehicle. Contact {siteConfig.businessName} for
            current availability and confirmed pricing.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-10">
        <aside className="lg:col-span-1">
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
            }
          >
            <InventoryFilters
              makes={makes}
              bodyTypes={bodyTypes}
              current={filterState}
              resultCount={vehicles.length}
            />
          </Suspense>
        </aside>

        <div className="lg:col-span-3">
          {vehicles.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
              <p className="text-lg font-semibold text-foreground">
                No vehicles found
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Try adjusting your filters or search terms. Our team can also
                help you source a specific make and model.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/inventory"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-light"
                >
                  Clear filters
                </Link>
                <Link
                  href="/#contact"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-medium transition hover:border-gold hover:text-gold"
                >
                  Contact us
                </Link>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 sm:gap-6">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id}>
                  <VehicleCard vehicle={vehicle} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
