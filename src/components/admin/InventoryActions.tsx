"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleFeaturedAction,
  unpublishVehicleAction,
  deleteVehicleAction,
  setAvailabilityAction,
} from "@/app/admin/actions";
import type { VehicleAvailability } from "@/lib/vehicle-types";

export function InventoryRowActions({
  id,
  featured,
  availability,
}: {
  id: string;
  featured: boolean;
  availability: VehicleAvailability;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function refresh() {
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`/admin/inventory/${id}/edit`}
        className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:border-gold hover:text-gold"
      >
        Edit
      </a>
      <a
        href={`/inventory/${id}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:border-gold hover:text-gold"
      >
        Preview
      </a>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await toggleFeaturedAction(id);
            refresh();
          })
        }
        className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:border-gold hover:text-gold disabled:opacity-50"
      >
        {featured ? "Unfeature" : "Feature"}
      </button>
      <select
        disabled={pending}
        defaultValue={availability}
        onChange={(e) => {
          const value = e.target.value as VehicleAvailability;
          start(async () => {
            await setAvailabilityAction(id, value);
            refresh();
          });
        }}
        className="rounded-full border border-border bg-background px-2 py-1 text-xs outline-none focus:border-gold"
      >
        <option value="available">Available</option>
        <option value="reserved">Reserved</option>
        <option value="sold">Sold</option>
        <option value="unpublished">Unpublished</option>
      </select>
      {availability !== "unpublished" && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await unpublishVehicleAction(id);
              refresh();
            })
          }
          className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:border-gold hover:text-gold disabled:opacity-50"
        >
          Unpublish
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              "Permanently delete this vehicle? Prefer Unpublish when possible."
            )
          ) {
            return;
          }
          start(async () => {
            await deleteVehicleAction(id);
            refresh();
          });
        }}
        className="rounded-full border border-red-500/40 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
