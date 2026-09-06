"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type InventoryFilterState = {
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
};

interface Props {
  makes: string[];
  bodyTypes: string[];
  current: InventoryFilterState;
  resultCount?: number;
}

const FILTER_KEYS = [
  "q",
  "make",
  "bodyType",
  "fuel",
  "transmission",
  "priceMin",
  "priceMax",
  "yearMin",
  "yearMax",
  "featured",
] as const;

function labelFor(key: string, value: string): string {
  switch (key) {
    case "q":
      return `Search: “${value}”`;
    case "featured":
      return "Featured";
    case "priceMin":
      return `Min ${value}`;
    case "priceMax":
      return `Max ${value}`;
    case "yearMin":
      return `From ${value}`;
    case "yearMax":
      return `To ${value}`;
    default:
      return value;
  }
}

export function InventoryFilters({
  makes,
  bodyTypes,
  current,
  resultCount,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(current.q || "");
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const activeChips = useMemo(() => {
    const chips: { key: string; value: string; label: string }[] = [];
    for (const key of FILTER_KEYS) {
      const value = current[key];
      if (value) chips.push({ key, value, label: labelFor(key, value) });
    }
    return chips;
  }, [current]);

  const hasActive = activeChips.length > 0;

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[44px] transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

  const filterBody = (
    <>
      {hasActive && (
        <div className="mb-4 flex flex-wrap gap-2" aria-label="Active filters">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => update(chip.key, "")}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold transition hover:bg-gold/20"
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label}
              <span aria-hidden="true" className="text-gold/80">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="inventory-search"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Search
        </label>
        <input
          id="inventory-search"
          type="search"
          placeholder="Make or model…"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (debounceRef.current) clearTimeout(debounceRef.current);
              update("q", searchValue);
            }
          }}
          className={fieldClass}
          autoComplete="off"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="filter-make"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Make
        </label>
        <select
          id="filter-make"
          value={current.make || ""}
          onChange={(e) => update("make", e.target.value)}
          className={fieldClass}
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
        <label
          htmlFor="filter-bodyType"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Body type
        </label>
        <select
          id="filter-bodyType"
          value={current.bodyType || ""}
          onChange={(e) => update("bodyType", e.target.value)}
          className={fieldClass}
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
        <label
          htmlFor="filter-fuel"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Fuel
        </label>
        <select
          id="filter-fuel"
          value={current.fuel || ""}
          onChange={(e) => update("fuel", e.target.value)}
          className={fieldClass}
        >
          <option value="">Any</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Electric">Electric</option>
        </select>
      </div>

      <div className="mb-4">
        <label
          htmlFor="filter-transmission"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Transmission
        </label>
        <select
          id="filter-transmission"
          value={current.transmission || ""}
          onChange={(e) => update("transmission", e.target.value)}
          className={fieldClass}
        >
          <option value="">Any</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>
      </div>

      <div className="mb-4">
        <label
          htmlFor="filter-featured"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Featured
        </label>
        <select
          id="filter-featured"
          value={current.featured === "true" ? "true" : ""}
          onChange={(e) => update("featured", e.target.value)}
          className={fieldClass}
        >
          <option value="">All vehicles</option>
          <option value="true">Featured only</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="filter-sort"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Sort by
        </label>
        <select
          id="filter-sort"
          value={current.sort || "newest"}
          onChange={(e) => update("sort", e.target.value)}
          className={fieldClass}
        >
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="mileage">Lowest mileage</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 lg:sticky lg:top-24">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">
            Filters
          </h2>
          {typeof resultCount === "number" && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {resultCount} result{resultCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActive && (
            <button
              type="button"
              onClick={clearAll}
              className="min-h-[44px] px-2 text-xs text-muted-foreground transition-colors hover:text-gold"
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center rounded-full border border-border px-3 text-xs font-medium lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="inventory-filter-panel"
          >
            {mobileOpen ? "Hide" : "Show"} filters
            {hasActive ? ` (${activeChips.length})` : ""}
          </button>
        </div>
      </div>

      <div
        id="inventory-filter-panel"
        className={`${mobileOpen ? "block" : "hidden"} lg:block`}
      >
        {filterBody}
      </div>
    </div>
  );
}
