import { Suspense } from "react";
import {

  searchVehicles,
  getAvailableMakes,
  getAvailableBodyTypes,
  isSampleInventory,
} from "@/lib/vehicles-public";
import { VehicleCard } from "@/components/VehicleCard";
import { InventoryFilters } from "@/components/InventoryFilters";




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
}



export const metadata = {
  title: "Inventory",
  description:
    "Browse our current selection of premium vehicles at Tosin Signature Motors. Driven by Trust. Built for You.",
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
    sort: (params.sort as "newest" | "price-asc" | "price-desc" | "mileage") || "newest",

    priceMin: params.priceMin ? Number(params.priceMin) : undefined,
    priceMax: params.priceMax ? Number(params.priceMax) : undefined,
    yearMin: params.yearMin ? Number(params.yearMin) : undefined,
    yearMax: params.yearMax ? Number(params.yearMax) : undefined,
  });

  const makes = await getAvailableMakes();
  const bodyTypes = await getAvailableBodyTypes();
  const sample = await isSampleInventory();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-gold mb-2">
          Our Collection
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Vehicle Inventory</h1>
        <p className="mt-2 text-muted-foreground">
          {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} matching your search
        </p>
        {sample && (
          <p className="mt-3 text-xs text-muted-foreground/80 border border-border rounded-lg px-3 py-2 bg-card max-w-2xl">
            Catalogue photos are being prepared. Listings below use sample specifications for
            demonstration — prices are shown in the currency recorded for each vehicle (USD).
            Contact Tosin Signature Motors for current availability and confirmed pricing.
          </p>
        )}
      </div>


      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <Suspense
            fallback={
              <div className="rounded-xl border border-border bg-card p-5 h-64 animate-pulse" />
            }
          >
            <InventoryFilters makes={makes} bodyTypes={bodyTypes} current={params} />
          </Suspense>
        </aside>


        {/* Results */}
        <div className="flex-1">
          {vehicles.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <p className="text-lg font-medium text-foreground mb-2">No vehicles found</p>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
