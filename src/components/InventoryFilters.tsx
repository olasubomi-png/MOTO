"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  makes: string[];
  bodyTypes: string[];
  current: Record<string, string | undefined>;
}

export function InventoryFilters({ makes, bodyTypes, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = () => {
    router.push(pathname);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sticky top-24">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Filters</h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-gold transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Search</label>
        <input
          type="search"
          placeholder="Make or model..."
          defaultValue={current.q || ""}
          onChange={(e) => update("q", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
      </div>

      {/* Make */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Make</label>
        <select
          value={current.make || ""}
          onChange={(e) => update("make", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
        >
          <option value="">All makes</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Body type */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Body Type</label>
        <select
          value={current.bodyType || ""}
          onChange={(e) => update("bodyType", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
        >
          <option value="">All types</option>
          {bodyTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Fuel */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fuel</label>
        <select
          value={current.fuel || ""}
          onChange={(e) => update("fuel", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
        >
          <option value="">Any</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Electric">Electric</option>
        </select>
      </div>

      {/* Transmission */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Transmission</label>
        <select
          value={current.transmission || ""}
          onChange={(e) => update("transmission", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
        >
          <option value="">Any</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sort by</label>
        <select
          value={current.sort || "newest"}
          onChange={(e) => update("sort", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="mileage">Lowest mileage</option>
        </select>
      </div>
    </div>
  );
}
