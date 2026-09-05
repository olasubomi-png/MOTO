"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  makes: string[];
  bodyTypes: string[];
  current: Record<string, string | undefined>;
}

export function InventoryFilters({ makes, bodyTypes, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(current.q || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(current.q || "");
  }, [current.q]);

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

  const onSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      update("q", value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const clearAll = () => {
    setSearchValue("");
    router.push(pathname);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Filters</h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-gold transition-colors px-2 py-2"
        >
          Clear all
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="inventory-search" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Search
        </label>
        <input
          id="inventory-search"
          type="search"
          placeholder="Make or model..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[44px] focus:border-gold focus:outline-none"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="filter-make" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Make
        </label>
        <select
          id="filter-make"
          value={current.make || ""}
          onChange={(e) => update("make", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[44px] focus:border-gold focus:outline-none"
        >
          <option value="">All makes</option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="filter-body" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Body Type
        </label>
        <select
          id="filter-body"
          value={current.bodyType || ""}
          onChange={(e) => update("bodyType", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[44px] focus:border-gold focus:outline-none"
        >
          <option value="">All types</option>
          {bodyTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="filter-fuel" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Fuel
        </label>
        <select
          id="filter-fuel"
          value={current.fuel || ""}
          onChange={(e) => update("fuel", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[44px] focus:border-gold focus:outline-none"
        >
          <option value="">Any</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Electric">Electric</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="filter-transmission" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Transmission
        </label>
        <select
          id="filter-transmission"
          value={current.transmission || ""}
          onChange={(e) => update("transmission", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[44px] focus:border-gold focus:outline-none"
        >
          <option value="">Any</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-sort" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Sort by
        </label>
        <select
          id="filter-sort"
          value={current.sort || "newest"}
          onChange={(e) => update("sort", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[44px] focus:border-gold focus:outline-none"
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
